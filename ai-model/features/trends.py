import pandas as pd
import os

# ─────────────────────────────────────────────────────────────────
#  Crime Trend Analysis
#  Analyzes crime patterns over time from crime_dataset_india.csv
#  No model training needed — pure pandas analysis
#
#  Answers questions like:
#  - Which months have most crimes?
#  - Which crime type is increasing?
#  - What time of day is most dangerous?
#  - Which weapon is used most?
# ─────────────────────────────────────────────────────────────────

DATASET_PATH = os.path.join(
    os.path.dirname(__file__), '..', 'data', 'crime_dataset_india.csv'
)


def load_dataset() -> pd.DataFrame:
    """Load and clean the crime dataset."""
    df = pd.read_csv(DATASET_PATH, skipinitialspace=True)

    # Clean column names — same as train.py
    df.columns = (
        df.columns
        .str.strip()
        .str.replace(' ', '_')
        .str.lower()
    )

    # Rename columns
    df.rename(columns={
        'date':     'date_of_occurrence',
        'time':     'time_of_occurrence',
        'location': 'city',
    }, inplace=True)

    return df


def parse_dates(df: pd.DataFrame) -> pd.DataFrame:
    """
    Try to parse date_of_occurrence into datetime.
    Handles multiple formats safely.
    """
    df = df.copy()

    if 'date_of_occurrence' not in df.columns:
        return df

    df['date_parsed'] = pd.to_datetime(
        df['date_of_occurrence'],
        infer_datetime_format=True,
        errors='coerce'
    )

    # Drop rows where date couldn't be parsed
    df = df.dropna(subset=['date_parsed'])

    df['year']  = df['date_parsed'].dt.year
    df['month'] = df['date_parsed'].dt.month
    df['month_name'] = df['date_parsed'].dt.strftime('%b')  # Jan, Feb...
    df['day_of_week'] = df['date_parsed'].dt.strftime('%A') # Monday...
    df['year_month']  = df['date_parsed'].dt.strftime('%Y-%m')

    return df


def parse_time_slots(df: pd.DataFrame) -> pd.DataFrame:
    """Parse time_of_occurrence into time slots."""
    df = df.copy()

    if 'time_of_occurrence' not in df.columns:
        return df

    df['hour'] = pd.to_datetime(
        df['time_of_occurrence'],
        format='%H:%M',
        errors='coerce'
    ).dt.hour

    def to_slot(hour):
        if pd.isna(hour):
            return 'Unknown'
        hour = int(hour)
        if 5  <= hour < 12: return 'Morning (5AM-12PM)'
        if 12 <= hour < 17: return 'Afternoon (12PM-5PM)'
        if 17 <= hour < 21: return 'Evening (5PM-9PM)'
        return 'Night (9PM-5AM)'

    df['time_slot'] = df['hour'].apply(to_slot)
    return df


def get_trend_direction(values: list) -> str:
    """
    Given a list of counts over time,
    return 'increasing', 'decreasing', or 'stable'.
    """
    if len(values) < 2:
        return 'stable'

    # Compare first half avg vs second half avg
    mid        = len(values) // 2
    first_avg  = sum(values[:mid])  / max(mid, 1)
    second_avg = sum(values[mid:])  / max(len(values) - mid, 1)

    diff_pct = ((second_avg - first_avg) / max(first_avg, 1)) * 100

    if diff_pct > 10:
        return 'increasing'
    elif diff_pct < -10:
        return 'decreasing'
    else:
        return 'stable'


def analyze_trends(
    group_by:   str  = 'month',
    city:       str  = None,
    crime_type: str  = None,
    start_date: str  = None,
    end_date:   str  = None,
) -> dict:
    """
    Analyze crime trends from the dataset.

    Args:
        group_by   : 'day' | 'month' | 'year' | 'weekday' | 'timeslot'
        city       : Filter by city (optional)
        crime_type : Filter by crime type (optional)
        start_date : ISO date string e.g. '2023-01-01' (optional)
        end_date   : ISO date string e.g. '2023-12-31' (optional)

    Returns:
        Full trend analysis dict
    """
    try:
        df = load_dataset()

        # ── Parse dates and time ──────────────────────────────────
        df = parse_dates(df)
        df = parse_time_slots(df)

        if df.empty:
            return {
                "success": False,
                "error":   "No data after date parsing"
            }

        # ── Apply filters ─────────────────────────────────────────
        if city:
            df = df[df['city'].str.lower().str.contains(
                city.lower(), na=False
            )]

        if crime_type:
            df = df[df['crime_type'].str.lower().str.contains(
                crime_type.lower(), na=False
            )]

        if start_date:
            df = df[df['date_parsed'] >= pd.to_datetime(start_date)]

        if end_date:
            df = df[df['date_parsed'] <= pd.to_datetime(end_date)]

        if df.empty:
            return {
                "success": False,
                "error":   "No data found for the given filters"
            }

        # ── 1. Main trend — group by selected period ──────────────
        if group_by == 'year':
            period_col   = 'year'
            period_label = 'year'
        elif group_by == 'day':
            period_col   = 'date_parsed'
            period_label = 'date'
            df['date_parsed'] = df['date_parsed'].dt.strftime('%Y-%m-%d')
        elif group_by == 'weekday':
            period_col   = 'day_of_week'
            period_label = 'weekday'
        elif group_by == 'timeslot':
            period_col   = 'time_slot'
            period_label = 'timeSlot'
        else:
            # Default: month
            period_col   = 'year_month'
            period_label = 'month'

        # Group total crimes per period
        trend_data = (
            df.groupby(period_col)
            .agg(totalCrimes=('crime_type', 'count'))
            .reset_index()
            .rename(columns={period_col: period_label})
            .sort_values(period_label)
        )

        # ── 2. Crime type breakdown per period ────────────────────
        crime_breakdown = (
            df.groupby([period_col, 'crime_type'])
            .size()
            .reset_index(name='count')
        )

        # Pivot so each crime type is a column
        crime_pivot = crime_breakdown.pivot_table(
            index=period_col,
            columns='crime_type',
            values='count',
            fill_value=0
        ).reset_index()
        crime_pivot.columns.name = None
        crime_pivot = crime_pivot.rename(columns={period_col: period_label})
        crime_pivot = crime_pivot.sort_values(period_label)

        # Merge with trend_data
        trend_merged = pd.merge(
            trend_data,
            crime_pivot,
            on=period_label,
            how='left'
        )

        trend_list = trend_merged.to_dict(orient='records')

        # ── 3. Overall stats ──────────────────────────────────────
        total_crimes      = int(df['crime_type'].count())
        most_common_crime = df['crime_type'].value_counts().index[0]
        peak_period       = trend_data.loc[
            trend_data['totalCrimes'].idxmax(), period_label
        ]
        least_period      = trend_data.loc[
            trend_data['totalCrimes'].idxmin(), period_label
        ]

        # Trend direction
        counts         = trend_data['totalCrimes'].tolist()
        trend_direction = get_trend_direction(counts)

        # ── 4. Crime type distribution (all time) ─────────────────
        crime_distribution = (
            df['crime_type']
            .value_counts()
            .reset_index()
            .rename(columns={'index': 'crimeType', 'crime_type': 'count'})
            .head(10)
            .to_dict(orient='records')
        )

        # ── 5. Time slot analysis ─────────────────────────────────
        time_slot_data = (
            df.groupby('time_slot')
            .agg(totalCrimes=('crime_type', 'count'))
            .reset_index()
            .rename(columns={'time_slot': 'timeSlot'})
            .sort_values('totalCrimes', ascending=False)
            .to_dict(orient='records')
        )

        most_dangerous_time = (
            time_slot_data[0]['timeSlot']
            if time_slot_data else 'Unknown'
        )

        # ── 6. Weekday analysis ───────────────────────────────────
        day_order = [
            'Monday','Tuesday','Wednesday',
            'Thursday','Friday','Saturday','Sunday'
        ]
        weekday_data = (
            df.groupby('day_of_week')
            .agg(totalCrimes=('crime_type', 'count'))
            .reset_index()
            .rename(columns={'day_of_week': 'weekday'})
        )
        # Sort by day order
        weekday_data['sort'] = weekday_data['weekday'].apply(
            lambda x: day_order.index(x) if x in day_order else 99
        )
        weekday_data = (
            weekday_data
            .sort_values('sort')
            .drop(columns='sort')
            .to_dict(orient='records')
        )

        most_dangerous_day = (
            max(weekday_data, key=lambda x: x['totalCrimes'])['weekday']
            if weekday_data else 'Unknown'
        )

        # ── 7. Weapon usage stats (if column exists) ──────────────
        weapon_data = []
        if 'weapon_used' in df.columns:
            weapon_data = (
                df['weapon_used']
                .value_counts()
                .reset_index()
                .rename(columns={'index': 'weapon', 'weapon_used': 'count'})
                .head(5)
                .to_dict(orient='records')
            )

        # ── 8. City-wise breakdown (if no city filter) ────────────
        city_breakdown = []
        if not city and 'city' in df.columns:
            city_breakdown = (
                df.groupby('city')
                .agg(totalCrimes=('crime_type', 'count'))
                .reset_index()
                .sort_values('totalCrimes', ascending=False)
                .head(10)
                .to_dict(orient='records')
            )

        return {
            "success":    True,
            "filters": {
                "groupBy":   group_by,
                "city":      city      or "All Cities",
                "crimeType": crime_type or "All Types",
                "startDate": start_date or "All Time",
                "endDate":   end_date   or "All Time",
            },
            "summary": {
                "totalCrimes":       total_crimes,
                "mostCommonCrime":   most_common_crime,
                "trendDirection":    trend_direction,
                "peakPeriod":        str(peak_period),
                "leastActivePeriod": str(least_period),
                "mostDangerousTime": most_dangerous_time,
                "mostDangerousDay":  most_dangerous_day,
            },
            "trends":            trend_list,
            "crimeDistribution": crime_distribution,
            "timeSlotAnalysis":  time_slot_data,
            "weekdayAnalysis":   weekday_data,
            "weaponStats":       weapon_data,
            "cityBreakdown":     city_breakdown,
        }

    except FileNotFoundError:
        return {
            "success": False,
            "error":   "Dataset not found. Make sure crime_dataset_india.csv exists in data/"
        }
    except Exception as e:
        return {
            "success": False,
            "error":   f"Trend analysis failed: {str(e)}"
        }