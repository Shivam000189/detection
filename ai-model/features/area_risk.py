import pandas as pd
import os
from datetime import datetime

# ─────────────────────────────────────────────────────────────────
#  Area Risk Score
#  Gives a detailed risk profile for any given area (city)
#  based on historical crime data
#
#  Risk score is calculated using weighted formula:
#
#  score = (
#      crime_volume_weight   * 0.40 +   # how many crimes happened
#      severity_weight       * 0.30 +   # how severe were they
#      recency_weight        * 0.20 +   # how recent are the crimes
#      time_pattern_weight   * 0.10     # dangerous time patterns
#  ) normalized to 1-10
# ─────────────────────────────────────────────────────────────────

DATASET_PATH = os.path.join(
    os.path.dirname(__file__), '..', 'data', 'crime_dataset_india.csv'
)

# Severity weights for different crime types
# Higher = more severe crime
CRIME_SEVERITY_WEIGHTS = {
    'murder':          10,
    'rape':            10,
    'kidnapping':       9,
    'robbery':          8,
    'assault':          8,
    'dacoity':          8,
    'extortion':        7,
    'burglary':         6,
    'theft':            5,
    'fraud':            5,
    'cybercrime':       4,
    'vandalism':        3,
    'trespassing':      3,
    'suspicious':       2,
}

DEFAULT_SEVERITY_WEIGHT = 5  # for unknown crime types


def load_dataset() -> pd.DataFrame:
    """Load and clean the crime dataset."""
    df = pd.read_csv(DATASET_PATH, skipinitialspace=True)

    df.columns = (
        df.columns
        .str.strip()
        .str.replace(' ', '_')
        .str.lower()
    )

    df.rename(columns={
        'date':     'date_of_occurrence',
        'time':     'time_of_occurrence',
        'location': 'city',
    }, inplace=True)

    return df


def get_risk_label(score: float) -> str:
    if score >= 8:   return 'CRITICAL'
    if score >= 6:   return 'HIGH'
    if score >= 4:   return 'MEDIUM'
    if score >= 2:   return 'LOW'
    return 'VERY LOW'


def get_risk_color(label: str) -> str:
    """For frontend badge coloring."""
    colors = {
        'CRITICAL': '#dc2626',   # red
        'HIGH':     '#ea580c',   # orange
        'MEDIUM':   '#ca8a04',   # yellow
        'LOW':      '#16a34a',   # green
        'VERY LOW': '#0284c7',   # blue
    }
    return colors.get(label, '#6b7280')


def get_time_slot(hour: int) -> str:
    if 5  <= hour < 12: return 'Morning (5AM-12PM)'
    if 12 <= hour < 17: return 'Afternoon (12PM-5PM)'
    if 17 <= hour < 21: return 'Evening (5PM-9PM)'
    return 'Night (9PM-5AM)'


def calculate_recency_weight(df: pd.DataFrame) -> float:
    """
    More recent crimes = higher recency weight.
    Crimes in last 30 days get weight 1.0
    Crimes 30-90 days ago get weight 0.6
    Older crimes get weight 0.2
    """
    if 'date_parsed' not in df.columns:
        return 0.5

    today = pd.Timestamp.now()
    weights = []

    for date in df['date_parsed']:
        days_ago = (today - date).days
        if days_ago <= 30:
            weights.append(1.0)
        elif days_ago <= 90:
            weights.append(0.6)
        else:
            weights.append(0.2)

    return sum(weights) / len(weights) if weights else 0.5


def get_patrol_recommendation(
    risk_label:    str,
    safest_time:   str,
    dangerous_time: str,
    top_crimes:    list,
) -> str:
    """Generate patrol recommendation based on risk level."""

    crime_str = ', '.join(top_crimes[:2]) if top_crimes else 'crime'

    if risk_label == 'CRITICAL':
        return (
            f"URGENT: Deploy maximum patrol units immediately. "
            f"Focus on {crime_str} prevention. "
            f"Increase surveillance during {dangerous_time}. "
            f"Consider establishing a police checkpoint."
        )
    elif risk_label == 'HIGH':
        return (
            f"Deploy additional patrol units, especially during {dangerous_time}. "
            f"Priority focus on {crime_str}. "
            f"Set up visible police presence to deter criminal activity."
        )
    elif risk_label == 'MEDIUM':
        return (
            f"Increase patrol frequency during {dangerous_time}. "
            f"Monitor {crime_str} hotspots closely. "
            f"Regular check-ins with local community members recommended."
        )
    elif risk_label == 'LOW':
        return (
            f"Standard patrol schedule is sufficient. "
            f"Stay alert for {crime_str} during {dangerous_time}. "
            f"Community awareness programs can help maintain safety."
        )
    else:
        return (
            f"Area is relatively safe. "
            f"Maintain regular patrol schedule. "
            f"Safest time is {safest_time}."
        )


def get_area_risk(
    city:         str,
    time_of_day:  str = None,
) -> dict:
    """
    Calculate risk score for a given area (city).

    Args:
        city        : City/area name to analyze
        time_of_day : Optional — 'morning' | 'afternoon' | 'evening' | 'night'
                      If given, adjusts score for that specific time

    Returns:
        Detailed risk profile dict
    """
    try:
        df = load_dataset()

        # ── Filter by city ────────────────────────────────────────
        df_city = df[
            df['city'].str.lower().str.contains(
                city.lower(), na=False
            )
        ]

        if df_city.empty:
            return {
                "success":  False,
                "error":    f"No crime data found for '{city}'. "
                            f"Try a different city name."
            }

        df_city = df_city.copy()

        # ── Parse dates ───────────────────────────────────────────
        if 'date_of_occurrence' in df_city.columns:
            df_city['date_parsed'] = pd.to_datetime(
                df_city['date_of_occurrence'],
                infer_datetime_format=True,
                errors='coerce'
            )
            df_city = df_city.dropna(subset=['date_parsed'])

        # ── Parse time ────────────────────────────────────────────
        if 'time_of_occurrence' in df_city.columns:
            df_city['hour'] = pd.to_datetime(
                df_city['time_of_occurrence'],
                format='%H:%M',
                errors='coerce'
            ).dt.hour
            df_city['time_slot'] = df_city['hour'].apply(
                lambda h: get_time_slot(int(h)) if pd.notna(h) else 'Unknown'
            )

        total_crimes = len(df_city)

        # ── 1. Crime volume weight (0-1) ──────────────────────────
        # Compare this city's count to max in full dataset
        all_city_counts = df.groupby('city').size()
        max_count       = all_city_counts.max()
        city_count      = total_crimes
        volume_weight   = city_count / max_count if max_count > 0 else 0

        # ── 2. Severity weight (0-1) ──────────────────────────────
        severity_scores = df_city['crime_type'].apply(
            lambda c: CRIME_SEVERITY_WEIGHTS.get(
                str(c).lower().strip(),
                DEFAULT_SEVERITY_WEIGHT
            )
        )
        avg_severity    = severity_scores.mean()
        severity_weight = avg_severity / 10   # normalize to 0-1

        # ── 3. Recency weight (0-1) ───────────────────────────────
        recency_weight  = calculate_recency_weight(df_city)

        # ── 4. Time pattern weight (0-1) ──────────────────────────
        # If time_of_day filter given, check how active that slot is
        time_weight = 0.5  # default neutral
        if 'time_slot' in df_city.columns and time_of_day:
            time_map = {
                'morning':   'Morning (5AM-12PM)',
                'afternoon': 'Afternoon (12PM-5PM)',
                'evening':   'Evening (5PM-9PM)',
                'night':     'Night (9PM-5AM)',
            }
            slot = time_map.get(time_of_day.lower())
            if slot:
                slot_count  = len(df_city[df_city['time_slot'] == slot])
                time_weight = slot_count / total_crimes if total_crimes > 0 else 0

        # ── Final weighted risk score (1-10) ─────────────────────
        raw_score = (
            volume_weight   * 0.40 +
            severity_weight * 0.30 +
            recency_weight  * 0.20 +
            time_weight     * 0.10
        )
        risk_score = round(raw_score * 9 + 1, 1)   # scale to 1-10
        risk_score = max(1.0, min(10.0, risk_score)) # clamp

        risk_label = get_risk_label(risk_score)
        risk_color = get_risk_color(risk_label)

        # ── Crime type breakdown ──────────────────────────────────
        crime_counts = (
            df_city['crime_type']
            .value_counts()
            .reset_index()
        )
        crime_counts.columns = ['crimeType', 'count']
        crime_counts['percentage'] = (
            (crime_counts['count'] / total_crimes * 100)
            .round(1)
        )
        top_crimes     = crime_counts['crimeType'].head(5).tolist()
        crime_breakdown = crime_counts.head(5).to_dict(orient='records')

        # ── Time slot breakdown ───────────────────────────────────
        time_breakdown = []
        safest_time    = 'Unknown'
        dangerous_time = 'Unknown'

        if 'time_slot' in df_city.columns:
            time_counts = (
                df_city.groupby('time_slot')
                .size()
                .reset_index(name='count')
                .sort_values('count', ascending=False)
            )
            time_counts['percentage'] = (
                (time_counts['count'] / total_crimes * 100)
                .round(1)
            )
            time_breakdown = time_counts.rename(
                columns={'time_slot': 'timeSlot'}
            ).to_dict(orient='records')

            if not time_counts.empty:
                dangerous_time = time_counts.iloc[0]['time_slot']
                safest_time    = time_counts.iloc[-1]['time_slot']

        # ── Weekday breakdown ─────────────────────────────────────
        weekday_breakdown = []
        if 'date_parsed' in df_city.columns:
            df_city['weekday'] = df_city['date_parsed'].dt.strftime('%A')
            day_order = [
                'Monday','Tuesday','Wednesday',
                'Thursday','Friday','Saturday','Sunday'
            ]
            wd_counts = (
                df_city.groupby('weekday')
                .size()
                .reset_index(name='count')
            )
            wd_counts['sort'] = wd_counts['weekday'].apply(
                lambda x: day_order.index(x) if x in day_order else 99
            )
            weekday_breakdown = (
                wd_counts.sort_values('sort')
                .drop(columns='sort')
                .to_dict(orient='records')
            )

        # ── Monthly trend for this city ───────────────────────────
        monthly_trend = []
        if 'date_parsed' in df_city.columns:
            df_city['year_month'] = df_city['date_parsed'].dt.strftime('%Y-%m')
            monthly_trend = (
                df_city.groupby('year_month')
                .size()
                .reset_index(name='totalCrimes')
                .rename(columns={'year_month': 'month'})
                .sort_values('month')
                .to_dict(orient='records')
            )

        # ── Weapon stats ──────────────────────────────────────────
        weapon_stats = []
        if 'weapon_used' in df_city.columns:
            weapon_stats = (
                df_city['weapon_used']
                .value_counts()
                .reset_index()
                .rename(columns={
                    'index':       'weapon',
                    'weapon_used': 'count'
                })
                .head(5)
                .to_dict(orient='records')
            )

        # ── Score breakdown (for frontend display) ────────────────
        score_breakdown = {
            "crimeVolume": round(volume_weight   * 10, 1),
            "severity":    round(severity_weight * 10, 1),
            "recency":     round(recency_weight  * 10, 1),
            "timePattern": round(time_weight     * 10, 1),
        }

        # ── Patrol recommendation ─────────────────────────────────
        recommendation = get_patrol_recommendation(
            risk_label, safest_time, dangerous_time, top_crimes
        )

        return {
            "success":    True,
            "city":       city,
            "timeFilter": time_of_day or "All Day",

            # Main risk result
            "riskScore":  risk_score,
            "riskLevel":  risk_label,
            "riskColor":  risk_color,

            # Score breakdown
            "scoreBreakdown": score_breakdown,

            # Summary
            "summary": {
                "totalCrimes":      total_crimes,
                "mostCommonCrime":  top_crimes[0] if top_crimes else "N/A",
                "topCrimes":        top_crimes,
                "mostDangerousTime": dangerous_time,
                "safestTime":       safest_time,
                "recommendation":   recommendation,
            },

            # Detailed breakdowns for charts
            "crimeBreakdown":   crime_breakdown,
            "timeBreakdown":    time_breakdown,
            "weekdayBreakdown": weekday_breakdown,
            "monthlyTrend":     monthly_trend,
            "weaponStats":      weapon_stats,
        }

    except FileNotFoundError:
        return {
            "success": False,
            "error":   "Dataset not found. Make sure crime_dataset_india.csv exists in data/"
        }
    except Exception as e:
        return {
            "success": False,
            "error":   f"Area risk analysis failed: {str(e)}"
        }