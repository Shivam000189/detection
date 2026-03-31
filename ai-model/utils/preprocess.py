# utils/preprocess.py
import pandas as pd

def preprocess_data(df, target_col='crime_type'):
    
    if 'time_of_occurrence' in df.columns:
        df['hour'] = pd.to_datetime(df['time_of_occurrence'], errors='coerce').dt.hour
    elif 'time' in df.columns:
        df['hour'] = pd.to_datetime(df['time'], errors='coerce').dt.hour
    else:
        df['hour'] = 0

    if 'date_of_occurrence' in df.columns:
        dt = pd.to_datetime(df['date_of_occurrence'], errors='coerce')
        df['day_of_week'] = dt.dt.dayofweek
        df['month'] = dt.dt.month
    else:
        df['day_of_week'] = 0
        df['month'] = 0

    if 'date_case_closed' in df.columns:
        dcc = pd.to_datetime(df['date_case_closed'], errors='coerce')
        df['case_close_hour'] = dcc.dt.hour
        df['case_close_month'] = dcc.dt.month

    hotspot_locations = ['Delhi']
    if 'city' in df.columns:
        df['is_hotspot'] = df['city'].apply(lambda x: 1 if x in hotspot_locations else 0)
    elif 'location' in df.columns:
        df['is_hotspot'] = df['location'].apply(lambda x: 1 if x in hotspot_locations else 0)
    else:
        df['is_hotspot'] = 0

    # ✅ Drop all date/time columns BEFORE get_dummies
    date_cols = ['time_of_occurrence', 'time', 'date_of_occurrence', 
                 'date_reported', 'date_case_closed', 'report_number']
    df = df.drop(columns=[c for c in date_cols if c in df.columns])

    # ✅ One-hot encode only remaining categoricals, exclude target
    cat_cols = df.select_dtypes(include=['object']).columns.tolist()
    if target_col in cat_cols:
        cat_cols.remove(target_col)

    df = pd.get_dummies(df, columns=cat_cols, dummy_na=False)  # ✅ dummy_na=False

    return df