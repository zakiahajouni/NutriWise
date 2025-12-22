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
 */
export async function createRecommendationModel(config: ModelConfig): Promise<any> {
  const tf = await getTensorFlow()
  const model = tf.sequential()

  // Input layer
  model.add(tf.layers.dense({
    inputShape: [config.inputSize],
    units: config.hiddenLayers[0] || 128,
    activation: 'relu',
    name: 'input_layer'
  }))

  // Hidden layers
  for (let i = 1; i < config.hiddenLayers.length; i++) {
    model.add(tf.layers.dense({
      units: config.hiddenLayers[i],
      activation: 'relu',
      name: `hidden_layer_${i}`
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
    name: 'output_layer'
  }))

  // Compile model
  model.compile({
    optimizer: tf.train.adam(config.learningRate || 0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
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
  batchSize: number = 32
): Promise<any> {
  const tf = await getTensorFlow()
  // Convert data to tensors
  const xs = tf.tensor2d(trainingData.features)
  const ys = tf.oneHot(tf.tensor1d(trainingData.labels, 'int32'), trainingData.labels.length)

  let validationXs: any | undefined
  let validationYs: any | undefined

  if (validationData) {
    validationXs = tf.tensor2d(validationData.features)
    validationYs = tf.oneHot(tf.tensor1d(validationData.labels, 'int32'), validationData.labels.length)
  }

  // Train model
  const history = await model.fit(xs, ys, {
    epochs,
    batchSize,
    validationData: validationXs && validationYs ? [validationXs, validationYs] : undefined,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch: number, logs?: any) => {
        console.log(`Epoch ${epoch + 1}/${epochs} - loss: ${logs?.loss?.toFixed(4)} - accuracy: ${logs?.acc?.toFixed(4)}`)
        if (logs?.valLoss) {
          console.log(`  val_loss: ${logs.valLoss.toFixed(4)} - val_accuracy: ${logs.valAcc?.toFixed(4)}`)
        }
      }
    }
  })

  // Clean up tensors
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
  // Serialize model
  const modelJson = await model.save('memory://')
  
  // Convert to buffer for MySQL
  const modelBuffer = Buffer.from(JSON.stringify(modelJson))

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
}

/**
 * Loads a model from the database
 */
export async function loadModelFromDB(
  modelName: string,
  modelVersion: string
): Promise<any | null> {
  try {
    const db = (await import('@/lib/db')).default
    const tf = await getTensorFlow()

    const [rows] = await db.execute(
      `SELECT model_data FROM ml_models 
       WHERE model_name = ? AND model_version = ? AND is_active = TRUE
       ORDER BY created_at DESC LIMIT 1`,
      [modelName, modelVersion]
    ) as any[]

    if (!rows || rows.length === 0) {
      return null
    }

    const modelJson = JSON.parse(rows[0].model_data.toString())
    const model = await tf.loadLayersModel('memory://' + JSON.stringify(modelJson))

    return model
  } catch (error) {
    console.error('Error loading model:', error)
    return null
  }
}

