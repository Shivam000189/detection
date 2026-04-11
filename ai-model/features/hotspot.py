import pandas as pd
import os

# ─────────────────────────────────────────────────────────────────
#  Hotspot Prediction
#  Uses your existing crime_dataset_india.csv
#  No new model training needed — pure pandas analysis
# ─────────────────────────────────────────────────────────────────

DATASET_PATH = os.path.join(
    os.path.dirname(__file__), '..', 'data', 'crime_dataset_india.csv'
)

def load_dataset() -> pd.DataFrame:
    """Load and clean the crime dataset."""
    df = pd.read_csv(DATASET_PATH, skipinitialspace=True)

    # Clean column names — same as your train.py
    df.columns = (
        df.columns
        .str.strip()
        .str.replace(' ', '_')
        .str.lower()
    )

    # Rename to match your convention
    df.rename(columns={
        'date':     'date_of_occurrence',
        'time':     'time_of_occurrence',
        'location': 'city',
    }, inplace=True)

    return df


def get_risk_level(score: float) -> str:
    """Convert numeric risk score (1-10) to label."""
    if score >= 7:
        return "HIGH"
    elif score >= 4:
        return "MEDIUM"
    else:
        return "LOW"


def get_time_slot(hour: int) -> str:
    """Convert hour to readable time slot."""
    if 5 <= hour < 12:
        return "morning (5AM-12PM)"
    elif 12 <= hour < 17:
        return "afternoon (12PM-5PM)"
    elif 17 <= hour < 21:
        return "evening (5PM-9PM)"
    else:
        return "night (9PM-5AM)"


def predict_hotspots(city: str = None, top_n: int = 5) -> dict:
    """
    Analyze historical crime data to find hotspot areas.

    Args:
        city  : Filter by city name (optional — if None, use all cities)
        top_n : How many top hotspots to return (default 5)

    Returns:
        dict with hotspots list + summary stats
    """
    try:
        df = load_dataset()

        # ── Filter by city if provided ────────────────────────────
        if city:
            # Case insensitive partial match
            df_filtered = df[
                df['city'].str.lower().str.contains(
                    city.lower(), na=False
                )
            ]
            # If no match found, use full dataset
            if df_filtered.empty:
                df_filtered = df
                city_used   = "All Cities (no match found)"
            else:
                city_used = city
        else:
            df_filtered = df
            city_used   = "All Cities"

        if df_filtered.empty:
            return {
                "success": False,
                "error":   "No data found for the given filters"
            }

        # ── Group by city and calculate stats per area ─────────────
        city_stats = df_filtered.groupby('city').agg(
            total_crimes    = ('crime_type', 'count'),
            unique_crimes   = ('crime_type', 'nunique'),
            most_common_crime = ('crime_type', lambda x: x.value_counts().index[0]),
        ).reset_index()

        # ── Calculate risk score (1-10) ───────────────────────────
        max_crimes = city_stats['total_crimes'].max()
        min_crimes = city_stats['total_crimes'].min()

        if max_crimes == min_crimes:
            city_stats['risk_score'] = 5.0
        else:
            # Normalize to 1-10 scale
            city_stats['risk_score'] = (
                (city_stats['total_crimes'] - min_crimes) /
                (max_crimes - min_crimes)
            ) * 9 + 1

        city_stats['risk_score'] = city_stats['risk_score'].round(1)

        # ── Sort by risk score descending ─────────────────────────
        city_stats = city_stats.sort_values(
            'risk_score', ascending=False
        ).head(top_n)

        # ── Get top crime types per hotspot area ──────────────────
        crime_types_per_city = (
            df_filtered.groupby(['city', 'crime_type'])
            .size()
            .reset_index(name='count')
        )

        # ── Get peak time per area ────────────────────────────────
        peak_time_per_city = {}
        if 'time_of_occurrence' in df_filtered.columns:
            try:
                df_filtered = df_filtered.copy()
                df_filtered['hour'] = pd.to_datetime(
                    df_filtered['time_of_occurrence'],
                    format='%H:%M',
                    errors='coerce'
                ).dt.hour

                peak_hours = (
                    df_filtered.dropna(subset=['hour'])
                    .groupby('city')['hour']
                    .agg(lambda x: x.value_counts().index[0])
                )
                peak_time_per_city = peak_hours.to_dict()
            except Exception:
                pass

        # ── Build final hotspot list ──────────────────────────────
        hotspots = []

        for _, row in city_stats.iterrows():
            area = row['city']

            # Top 3 crime types for this area
            area_crimes = (
                crime_types_per_city[
                    crime_types_per_city['city'] == area
                ]
                .sort_values('count', ascending=False)
                .head(3)['crime_type']
                .tolist()
            )

            # Peak time
            peak_hour    = peak_time_per_city.get(area)
            peak_time_str = (
                get_time_slot(int(peak_hour))
                if peak_hour is not None
                else "Unknown"
            )

            risk_score = float(row['risk_score'])
            risk_level = get_risk_level(risk_score)

            # Patrol recommendation based on risk
            if risk_level == "HIGH":
                recommendation = (
                    f"Deploy additional patrol units in {area}. "
                    f"Focus during {peak_time_str}."
                )
            elif risk_level == "MEDIUM":
                recommendation = (
                    f"Increase surveillance in {area} during {peak_time_str}."
                )
            else:
                recommendation = (
                    f"Regular patrol sufficient for {area}."
                )

            hotspots.append({
                "area":           area,
                "riskScore":      risk_score,
                "riskLevel":      risk_level,
                "totalCrimes":    int(row['total_crimes']),
                "mostCommonCrime": row['most_common_crime'],
                "topCrimeTypes":  area_crimes,
                "peakTime":       peak_time_str,
                "recommendation": recommendation,
            })

        # ── Overall summary stats ─────────────────────────────────
        total_crimes_in_data  = int(df_filtered['crime_type'].count())
        most_dangerous_area   = hotspots[0]['area'] if hotspots else "N/A"
        most_common_crime_all = df_filtered['crime_type'].value_counts().index[0]

        return {
            "success":          True,
            "cityFilter":       city_used,
            "totalHotspots":    len(hotspots),
            "hotspots":         hotspots,
            "summary": {
                "totalCrimesAnalyzed": total_crimes_in_data,
                "mostDangerousArea":   most_dangerous_area,
                "mostCommonCrime":     most_common_crime_all,
                "topN":                top_n,
            }
        }

    except FileNotFoundError:
        return {
            "success": False,
            "error":   "Crime dataset not found. Make sure crime_dataset_india.csv exists in data/"
        }
    except Exception as e:
        return {
            "success": False,
            "error":   f"Hotspot analysis failed: {str(e)}"
        }