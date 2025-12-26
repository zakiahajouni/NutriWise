/**
 * TensorFlow.js model for recipe recommendation
 * Uses a deep neural network for recommendation
 */

// Dynamic import to avoid bundling issues - only used server-side
async function getTensorFlow() {
  return await import('@tensorflow/tfjs-node')
}

export interface ModelConfig {
  inputSize: number // Input vector size (ingredients + features)
  hiddenLayers: number[] // Hidden layer sizes
  outputSize: number // Number of recipes to recommend
  learningRate?: number
  dropout?: number
}

export interface TrainingData {
  features: number[][] // Feature vectors (ingredients, preferences, etc.)
  labels: number[] // IDs of preferred recipes
}

/**
 * Creates a recommendation model with TensorFlow.js
 * Improved architecture with batch normalization and better initialization
 */
export async function createRecommendationModel(config: ModelConfig): Promise<any> {
  const tf = await getTensorFlow()
  const model = tf.sequential()

  // Input layer with batch normalization and L2 regularization
  model.add(tf.layers.dense({
    inputShape: [config.inputSize],
    units: config.hiddenLayers[0] || 128,
    activation: 'relu',
    kernelInitializer: 'heNormal',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.0001 }), // L2 regularization
    name: 'input_layer'
  }))
  
  // Batch normalization for first layer
  model.add(tf.layers.batchNormalization({
    name: 'bn_input'
  }))

  // Hidden layers with batch normalization and L2 regularization
  for (let i = 1; i < config.hiddenLayers.length; i++) {
    model.add(tf.layers.dense({
      units: config.hiddenLayers[i],
      activation: 'relu',
      kernelInitializer: 'heNormal',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.0001 }), // L2 regularization
      name: `hidden_layer_${i}`
    }))
    
    // Batch normalization before dropout
    model.add(tf.layers.batchNormalization({
      name: `bn_${i}`
    }))

    // Dropout to prevent overfitting
    if (config.dropout) {
      model.add(tf.layers.dropout({
        rate: config.dropout,
        name: `dropout_${i}`
      }))
    }
  }

  // Output layer (probabilities for each recipe)
  model.add(tf.layers.dense({
    units: config.outputSize,
    activation: 'softmax',
    kernelInitializer: 'glorotUniform', // Better for softmax
    name: 'output_layer'
  }))

  // Use lower learning rate for better convergence
  const learningRate = config.learningRate || 0.001
  
  // Compile model with improved optimizer settings (Adam with weight decay)
  model.compile({
    optimizer: tf.train.adam(learningRate, 0.9, 0.999, 1e-8), // Adam with better defaults
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'] // Only use supported metrics
  })

  return model
}

/**
 * Trains the model with data
 */
export async function trainModel(
  model: any,
  trainingData: TrainingData,
  validationData?: TrainingData,
  epochs: number = 50,
  batchSize: number = 32,
  numClasses?: number
): Promise<any> {
  const tf = await getTensorFlow()
  
  // Get number of classes from model output shape or use provided value
  const outputSize = numClasses || (model.outputShape ? model.outputShape[model.outputShape.length - 1] : Math.max(...trainingData.labels) + 1)
  
  // Convert data to tensors
  const xs = tf.tensor2d(trainingData.features)
  const ys = tf.oneHot(tf.tensor1d(trainingData.labels, 'int32'), outputSize)

  let validationXs: any | undefined
  let validationYs: any | undefined

  if (validationData) {
    validationXs = tf.tensor2d(validationData.features)
    validationYs = tf.oneHot(tf.tensor1d(validationData.labels, 'int32'), outputSize)
  }

  // Learning rate scheduler callback with early stopping
  let currentLearningRate = (model.optimizer as any).learningRate || 0.001
  const initialLearningRate = currentLearningRate
  let bestValLoss = Infinity
  let patience = 15 // Early stopping patience
  let patienceCounter = 0
  let bestWeights: any = null
  
  // Train model with learning rate scheduling and early stopping
  const history = await model.fit(xs, ys, {
    epochs,
    batchSize,
    validationData: validationXs && validationYs ? [validationXs, validationYs] : undefined,
    shuffle: true,
    callbacks: {
      onEpochEnd: async (epoch: number, logs?: any) => {
        // Early stopping: save best weights
        if (logs?.valLoss) {
          if (logs.valLoss < bestValLoss) {
            bestValLoss = logs.valLoss
            patienceCounter = 0
            // Save current weights
            bestWeights = model.getWeights().map((w: any) => w.clone())
          } else {
            patienceCounter++
          }
        }
        
        // Reduce learning rate on plateau (more aggressive)
        if (logs?.valLoss && epoch > 5 && epoch % 5 === 0) {
          const newLR = currentLearningRate * 0.9
          if (newLR > initialLearningRate * 0.0001) { // Don't go below 0.01% of initial LR
            currentLearningRate = newLR
            model.optimizer.setLearningRate(newLR)
          }
        }
        
        const lr = (model.optimizer as any).learningRate || currentLearningRate
        console.log(`Epoch ${epoch + 1}/${epochs} - loss: ${logs?.loss?.toFixed(4)} - accuracy: ${logs?.acc?.toFixed(4)} - lr: ${lr.toFixed(6)}`)
        if (logs?.valLoss) {
          console.log(`  val_loss: ${logs.valLoss.toFixed(4)} - val_accuracy: ${logs.valAcc?.toFixed(4)} - patience: ${patienceCounter}/${patience}`)
        }
        
        // Early stopping check
        if (patienceCounter >= patience && bestWeights) {
          console.log(`⏹️  Early stopping triggered. Restoring best weights...`)
          model.setWeights(bestWeights)
          // Don't dispose bestWeights here - they're now part of the model
          bestWeights = null
          return false // Stop training
        }
      }
    }
  })

  // Clean up tensors (but keep model weights intact)
  xs.dispose()
  ys.dispose()
  if (validationXs) validationXs.dispose()
  if (validationYs) validationYs.dispose()

  return history
}

/**
 * Predicts recommended recipes for a user
 */
export async function predictRecipes(
  model: any,
  userFeatures: number[],
  topK: number = 5
): Promise<{ recipeId: number; score: number }[]> {
  const tf = await getTensorFlow()
  const input = tf.tensor2d([userFeatures])
  const predictions = model.predict(input) as any
  
  const scores = await predictions.data()
  const predictionsArray = Array.from(scores) as number[]

  // Sort by descending score and take top K
  const indexed = predictionsArray.map((score: number, index: number) => ({
    recipeId: index,
    score: score as number
  }))

  indexed.sort((a, b) => (b.score as number) - (a.score as number))

  input.dispose()
  predictions.dispose()

  return indexed.slice(0, topK)
}

/**
 * Saves the model to the database
 */
export async function saveModelToDB(
  model: any,
  modelName: string,
  modelVersion: string,
  metadata: any
): Promise<number> {
  const tf = await getTensorFlow()
  const fs = await import('fs')
  const path = await import('path')
  const os = await import('os')
  
  // Create temporary directory for model saving
  const tempDir = path.join(os.tmpdir(), `tfjs-model-${Date.now()}`)
  fs.mkdirSync(tempDir, { recursive: true })
  
  try {
    // Check if model is disposed before saving
    try {
      const testWeights = model.getWeights()
      if (!testWeights || testWeights.length === 0) {
        throw new Error('Model weights are not available - model may be disposed')
      }
      // Dispose test weights immediately
      testWeights.forEach((w: any) => {
        try {
          if (w && !w.isDisposed) {
            w.dispose()
          }
        } catch (e) {
          // Ignore
        }
      })
    } catch (checkError: any) {
      throw new Error(`Model is not ready for saving: ${checkError.message}`)
    }
    
    // Save model to temporary directory
    await model.save(`file://${tempDir}`)
    
    // Read the saved model files
    const modelJsonPath = path.join(tempDir, 'model.json')
    const modelJsonContent = fs.readFileSync(modelJsonPath, 'utf-8')
    const modelJson = JSON.parse(modelJsonContent)
    
    // Read weight files
    const weightsManifest = modelJson.weightsManifest || []
    const weightsData: number[][] = []
    
    for (const group of weightsManifest) {
      for (let i = 0; i < group.weights.length; i++) {
        const weight = group.weights[i]
        const weightPath = path.join(tempDir, group.paths[i] || weight.name)
        if (fs.existsSync(weightPath)) {
          const weightBuffer = fs.readFileSync(weightPath)
          // Convert binary weights to array (weights are stored as Float32)
          const float32Array = new Float32Array(weightBuffer.buffer, weightBuffer.byteOffset, weightBuffer.byteLength / 4)
          const weightArray = Array.from(float32Array)
          weightsData.push(weightArray)
        }
      }
    }
    
    // Create serializable model object
    const serializedModel = {
      modelTopology: modelJson.modelTopology,
      weightsManifest: modelJson.weightsManifest,
      weightsData: weightsData
    }
    
    // Convert to buffer for MySQL
    const modelBuffer = Buffer.from(JSON.stringify(serializedModel))
    
    // Clean up temporary directory
    fs.rmSync(tempDir, { recursive: true, force: true })
    
    const db = (await import('@/lib/db')).default

    const [result] = await db.execute(
      `INSERT INTO ml_models 
       (model_name, model_type, model_version, model_data, model_metadata, training_data_size, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       model_data = VALUES(model_data),
       model_metadata = VALUES(model_metadata),
       training_data_size = VALUES(training_data_size),
       updated_at = CURRENT_TIMESTAMP`,
      [
        modelName,
        metadata.modelType || 'recommendation',
        modelVersion,
        modelBuffer,
        JSON.stringify(metadata),
        metadata.trainingDataSize || metadata.training_data_size || 0,
        false // Don't activate automatically
      ]
    ) as any[]

    return result.insertId || result[0]?.insertId || 0
  } catch (error) {
    // Clean up on error
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
    throw error
  }
}

/**
 * Loads a model from the database
 */
export async function loadModelFromDB(
  modelName: string,
  modelVersion: string = 'latest'
): Promise<any | null> {
  try {
    const db = (await import('@/lib/db')).default
    const tf = await getTensorFlow()
    const fs = await import('fs')
    const path = await import('path')
    const os = await import('os')

    // Build query based on version
    let query: string
    let params: any[]
    
    if (modelVersion === 'latest') {
      query = `SELECT model_data FROM ml_models 
               WHERE model_name = ? AND is_active = TRUE
               ORDER BY created_at DESC LIMIT 1`
      params = [modelName]
    } else {
      query = `SELECT model_data FROM ml_models 
               WHERE model_name = ? AND model_version = ? AND is_active = TRUE
               ORDER BY created_at DESC LIMIT 1`
      params = [modelName, modelVersion]
    }

    const [rows] = await db.execute(query, params) as any[]

    if (!rows || rows.length === 0) {
      return null
    }

    const serializedModel = JSON.parse(rows[0].model_data.toString())
    
    // Create temporary directory for model loading
    const tempDir = path.join(os.tmpdir(), `tfjs-load-${Date.now()}`)
    fs.mkdirSync(tempDir, { recursive: true })
    
    try {
      // Write model.json
      const modelJson = {
        modelTopology: serializedModel.modelTopology,
        weightsManifest: serializedModel.weightsManifest
      }
      fs.writeFileSync(path.join(tempDir, 'model.json'), JSON.stringify(modelJson))
      
      // Write weight files
      if (serializedModel.weightsManifest && serializedModel.weightsData) {
        let weightIndex = 0
        for (const group of serializedModel.weightsManifest) {
          for (const weight of group.weights) {
            if (weightIndex < serializedModel.weightsData.length) {
              const weightData = serializedModel.weightsData[weightIndex]
              const weightBuffer = Buffer.from(new Float32Array(weightData).buffer)
              const weightPath = path.join(tempDir, group.paths[0] || weight.name)
              fs.writeFileSync(weightPath, weightBuffer)
              weightIndex++
            }
          }
        }
      }
      
      // Load model from temporary directory
      const model = await tf.loadLayersModel(`file://${tempDir}/model.json`)
      
      // Clean up temporary directory
      fs.rmSync(tempDir, { recursive: true, force: true })
      
      return model
    } catch (error) {
      // Clean up on error
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true })
      }
      throw error
    }
  } catch (error) {
    console.error('Error loading model:', error)
    return null
  }
}

