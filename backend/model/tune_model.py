# import os
# import sys
# import pandas as pd
# import numpy as np
# from sklearn.ensemble import RandomForestClassifier
# from sklearn.model_selection import train_test_split, GridSearchCV
# from sklearn.metrics import classification_report
# import joblib
# import time
# import traceback

# def main():
#     print("⚙️ Initializing Hyperparameter Tuning Sequence...\n")
#     print("📊 Locating CICIDS2017 dataset file in raw storage...")

#     script_dir = os.path.dirname(os.path.abspath(__file__))
#     target_filename = "processed_Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv"
#     file_path = os.path.join(script_dir, "data", "processed", "cic", target_filename)

#     if not os.path.exists(file_path):
#         print(f"❌ ERROR: File not found at {file_path}")
#         return

#     print("📊 Loading raw CICIDS2017 network traffic into memory...")
#     dataset = pd.read_csv(file_path)

#     # 1. CLEAN UP THE COLUMNS
#     dataset.columns = dataset.columns.str.strip()
    
#     # 2. VERIFY COLUMNS EXIST
#     required_cols = ['Destination Port', 'Flow Duration', 'Total Fwd Packets', 'Label']
#     missing_cols = [col for col in required_cols if col not in dataset.columns]
    
#     if missing_cols:
#         print(f"\n❌ ERROR: The dataset is missing these columns: {missing_cols}")
#         print(f"Here are the columns I actually found:\n{list(dataset.columns)}")
#         return

#     # 3. THE RAM SAVER (Take a 10% random sample so your PC doesn't explode)
#     print("\n🔪 Slicing a 10% random sample for faster training...")
#     dataset = dataset.sample(frac=0.10, random_state=42).reset_index(drop=True)

#     # 4. PREPARE THE FEATURES
#     X = dataset[['Destination Port', 'Flow Duration', 'Total Fwd Packets']]
#     y = dataset['Label']

#     # Convert binary BENIGN vs ATTACK for cleaner classification
#     y = y.apply(lambda x: 'BENIGN' if 'BENIGN' in str(x).upper() else 'ATTACK')

#     # Replace any infinite math errors with 0
#     X = X.replace([np.inf, -np.inf], np.nan).fillna(0)
#     X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

#     # 5. THE ML FORGE (Grid Search)
#     param_grid = {
#         'n_estimators': [10, 50],      
#         'max_depth': [5, 10],         
#         'min_samples_split': [2, 5]     
#     }

#     print(f"🔍 Starting Grid Search across {len(param_grid['n_estimators']) * len(param_grid['max_depth']) * len(param_grid['min_samples_split'])} combinations...")
#     start_time = time.time()

#     base_model = RandomForestClassifier(random_state=42)
#     # n_jobs=2 limits it to 2 CPU cores to prevent crashing
#     grid_search = GridSearchCV(estimator=base_model, param_grid=param_grid, cv=3, n_jobs=2, verbose=1)

#     grid_search.fit(X_train, y_train)
#     elapsed_time = time.time() - start_time

#     print(f"\n✅ Grid Search Complete in {elapsed_time:.2f} seconds!")

#     # 6. EVALUATION
#     best_model = grid_search.best_estimator_
#     print("\n🏆 BEST HYPERPARAMETERS FOUND:")
#     print(grid_search.best_params_)

#     print("\n🔬 TESTING MODEL ON UNSEEN DATA (Classification Report):")
#     y_pred = best_model.predict(X_test)
#     print(classification_report(y_test, y_pred))

#     model_path = os.path.join(script_dir, "netshield_model.pkl")
#     joblib.dump(best_model, model_path)
#     print(f"\n🚀 Tuned model aggressively overwrote {model_path}. Ready for live sniffing.")

# if __name__ == "__main__":
#     try:
#         main()
#     except Exception as e:
#         print("\n❌ A FATAL ERROR OCCURRED:")
#         traceback.print_exc()
#     finally:
#         # THIS FORCES THE TERMINAL TO STAY OPEN
#         input("\n🛑 Press ENTER to close this window...")