import pandas as pd
import pickle
from sklearn.ensemble import RandomForestClassifier
from utils.preprocess import preprocess_data

# Load CSV
df = pd.read_csv("data/crime_dataset_india.csv", skipinitialspace=True)

# Clean column names
df.columns = df.columns.str.strip().str.replace(' ', '_').str.lower()

# Rename for clarity
df.rename(columns={
    'crime_type': 'crime_type',
    'date': 'date_of_occurrence',
    'time': 'time_of_occurrence',
    'location': 'city'
}, inplace=True)

print(df.columns.tolist())

# Preprocess
df = preprocess_data(df)
print(df.columns.tolist()) 

# Target and features
y = df['crime_type']
drop_cols = ['crime_type', 'time_of_occurrence', 'date_of_occurrence', 'report_number', 'date_reported', 'date_case_closed']
X = df.drop(columns=[col for col in drop_cols if col in df.columns])

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

# Save model
with open("models/crime_model.pkl", "wb") as f:
    pickle.dump(model, f)

print("Model trained and saved successfully!")