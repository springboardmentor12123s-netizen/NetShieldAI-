"""CLI Script to trigger target model training and document performance results."""

import asyncio
import os
import sys

# Load environment variables first to override database connection fallbacks
from dotenv import load_dotenv
load_dotenv()

# Insert backend folder to front of python systems search path
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(script_dir, "..", "backend"))

from app.ai.training.trainer import ModelTrainer
from app.ai.evaluation.evaluator import ModelEvaluator
from app.core.mongodb import MongoDBManager


async def main():
    print("====================================================")
    print("NetShield AI - Machine Learning Model training Engine")
    print("====================================================")
    
    # Initialize connection
    await MongoDBManager.connect()
    
    trainer = ModelTrainer(contamination=0.05, n_estimators=100)
    evaluator = ModelEvaluator()
    
    try:
        # Run training pipeline
        metrics = await trainer.train_and_evaluate()
        
        # Write reports
        evaluator.write_reports(metrics)
        
        print("\n[SUCCESS] Training completed successfully.")
        print(f"Overall Accuracy: {metrics.get('threat_classifier_accuracy', 0)*100:.2f}%")
        print(f"Outlier Anomaly Count: {metrics.get('anomalies_flagged', 0)}")
        print("Model assets and preprocessors have been persisted to disk.")
        
    except Exception as e:
        print(f"\n[FATAL] Model training failed: {e}")
        import traceback
        traceback.print_exc()

    finally:
        await MongoDBManager.disconnect()
        print("Disconnected databases.")


if __name__ == "__main__":
    asyncio.run(main())
