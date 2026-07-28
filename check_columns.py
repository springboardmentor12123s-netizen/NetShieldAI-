import pandas as pd 
df = pd.read_csv(r"C:\Users\chand\Downloads\archive\Payload_data_CICIDS2017.csv", nrows=1) 
print(list(df.columns))