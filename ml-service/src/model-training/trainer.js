const tf = require('@tensorflow/tfjs-node');
const { FeatureEngine } = require('../feature-engineering/engine');
const { ModelMonitor } = require('../monitoring/monitor');

class ModelTrainer {
  constructor() {
    this.featureEngine = new FeatureEngine();
    this.monitor = new ModelMonitor();
    this.models = new Map();
  }

  async trainAgentModel(agentId, trainingData, modelConfig) {
    try {
      // Feature engineering
      const features = await this.featureEngine.process(trainingData);
      
      // Model architecture based on agent type
      const model = this.createModelArchitecture(modelConfig);
      
      // Training process
      const history = await model.fit(features.x, features.y, {
        epochs: modelConfig.epochs || 100,
        batchSize: modelConfig.batchSize || 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            this.monitor.logTrainingProgress(agentId, epoch, logs);
          }
        }
      });

      // Save model
      await this.saveModel(agentId, model);
      
      // Update model registry
      this.models.set(agentId, {
        model,
        metadata: {
          trainedAt: new Date(),
          performance: history.history,
          features: features.metadata
        }
      });

      return {
        success: true,
        modelId: agentId,
        performance: history.history
      };
    } catch (error) {
      throw new Error(`Model training failed: ${error.message}`);
    }
  }

  createModelArchitecture(config) {
    const model = tf.sequential();
    
    // Input layer
    model.add(tf.layers.dense({
      units: config.hiddenUnits || 128,
      activation: 'relu',
      inputShape: [config.inputShape]
    }));
    
    // Hidden layers
    for (let i = 0; i < (config.hiddenLayers || 2); i++) {
      model.add(tf.layers.dense({
        units: config.hiddenUnits || 128,
        activation: 'relu'
      }));
    }
    
    // Output layer
    model.add(tf.layers.dense({
      units: config.outputUnits,
      activation: config.outputActivation || 'softmax'
    }));

    model.compile({
      optimizer: tf.train.adam(config.learningRate || 0.001),
      loss: config.loss || 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  async retrainModel(agentId, newData) {
    const existingModel = this.models.get(agentId);
    if (!existingModel) {
      throw new Error('Model not found for retraining');
    }

    // Incremental training with new data
    const features = await this.featureEngine.process(newData);
    
    const history = await existingModel.model.fit(features.x, features.y, {
      epochs: 10,
      batchSize: 32,
      validationSplit: 0.1
    });

    // Update model performance
    existingModel.metadata.retrainedAt = new Date();
    existingModel.metadata.performance = history.history;

    return {
      success: true,
      retrained: true,
      performance: history.history
    };
  }
}

module.exports = ModelTrainer;
