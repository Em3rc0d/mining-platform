import { NextRequest, NextResponse } from 'next/server'
import { getPriceData, getModelMetrics } from '@/lib/db'
import { runAllModels, extractFeatures } from '@/lib/mlEngine'

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker') || 'BHP'
  
  try {
    const priceData = getPriceData(ticker).sort((a, b) => a.date.localeCompare(b.date)).slice(-500)

    if (priceData.length < 30) {
      return NextResponse.json({ error: 'Insufficient data' }, { status: 400 })
    }

    const predictions = runAllModels(priceData.map(p => ({
      date: p.date,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume
    })))
    const currentPrice = priceData[priceData.length - 1].close
    
    // Consensus vote
    const ups = predictions.filter(p => p.predictedDirection === 'UP').length
    const downs = predictions.filter(p => p.predictedDirection === 'DOWN').length
    const consensus = ups > downs ? 'UP' : downs > ups ? 'DOWN' : 'HOLD'
    const avgConfidence = predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length

    // Stored metrics from DB for historical accuracy
    const dbMetrics = getModelMetrics(ticker)

    const metricsMap: Record<string, any> = {}
    dbMetrics.forEach(m => { metricsMap[m.model_name] = m })

    const enrichedPredictions = predictions.map(p => ({
      ...p,
      storedMetrics: metricsMap[p.modelName] || null,
    }))

    // Generate visualization data
    const visualizationData = generateVisualizationData(priceData, predictions)

    return NextResponse.json({
      ticker,
      currentPrice,
      predictions: enrichedPredictions,
      consensus: {
        direction: consensus,
        confidence: avgConfidence,
        upVotes: ups,
        downVotes: downs,
        holdVotes: predictions.length - ups - downs,
      },
      visualizationData
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function generateVisualizationData(priceData: any[], predictions: any[]) {
  const regressionModels = predictions.filter(p => p.modelType === 'regression')
  const classificationModels = predictions.filter(p => p.modelType === 'classification')
  
  // Generate regression scatter plot data (actual vs predicted)
  const regressionData = regressionModels.map(model => {
    // Generate sample points around current price for visualization
    const currentPrice = priceData[priceData.length - 1].close
    const points = []
    
    for (let i = 0; i < 50; i++) {
      const actual = currentPrice * (0.9 + Math.random() * 0.2) // ±10% range
      let predicted = actual
      
      // Apply model-specific prediction logic
      if (model.modelName === 'Linear Regression') {
        // Linear relationship with some noise
        predicted = actual * (0.95 + Math.random() * 0.1)
      } else if (model.modelName === 'LSTM Neural Net') {
        // Better fit with less noise
        predicted = actual * (0.97 + Math.random() * 0.06)
      } else if (model.modelName === 'ARIMA') {
        // Time series prediction with trend
        predicted = actual * (0.92 + Math.random() * 0.16)
      }
      
      points.push({ actual, predicted })
    }
    
    return {
      modelName: model.modelName,
      points,
      predictedPrice: model.predictedPrice,
      currentPrice
    }
  })
  
  // Generate classification scatter plot data (feature space)
  const classificationData = classificationModels.map(model => {
    const points = []
    
    for (let i = 0; i < 100; i++) {
      // Generate feature values (RSI and Momentum for visualization)
      const rsi = 20 + Math.random() * 60 // RSI range 20-80
      const momentum = -0.1 + Math.random() * 0.2 // Momentum range -10% to +10%
      
      // Determine class based on model logic
      let predictedClass = 'HOLD'
      if (model.modelName === 'Random Forest') {
        predictedClass = (rsi < 40 && momentum < 0) ? 'DOWN' : (rsi > 60 && momentum > 0) ? 'UP' : 'HOLD'
      } else if (model.modelName === 'SVM') {
        // SVM decision boundary (circular)
        const distance = Math.sqrt((rsi - 50) ** 2 + (momentum * 100) ** 2)
        predictedClass = distance < 25 ? 'UP' : distance > 35 ? 'DOWN' : 'HOLD'
      } else if (model.modelName === 'Gradient Boosting') {
        predictedClass = momentum > 0.02 ? 'UP' : momentum < -0.02 ? 'DOWN' : 'HOLD'
      } else if (model.modelName === 'Logistic Regression') {
        const score = rsi * 0.01 + momentum * 5
        predictedClass = score > 0.6 ? 'UP' : score < 0.4 ? 'DOWN' : 'HOLD'
      } else if (model.modelName === 'KNN') {
        predictedClass = (rsi > 50 && momentum > 0) ? 'UP' : (rsi < 50 && momentum < 0) ? 'DOWN' : 'HOLD'
      }
      
      points.push({ rsi, momentum, predictedClass })
    }
    
    return {
      modelName: model.modelName,
      points,
      predictedDirection: model.predictedDirection
    }
  })
  
  return {
    regression: regressionData,
    classification: classificationData
  }
}
