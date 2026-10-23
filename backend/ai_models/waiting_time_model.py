import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone, timedelta
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_absolute_error, r2_score


CLINIC_TIMEZONE = timezone(timedelta(hours=5, minutes=30))


def clinic_local_now():
    return datetime.now(CLINIC_TIMEZONE)



TRAINED_HOUR_MIN, TRAINED_HOUR_MAX = 8, 17


TRAINED_DOW_MIN, TRAINED_DOW_MAX = 0, 4


ZERO_QUEUE_OBSERVED_MAX = 90.0  # real data's actual max (85.6) 


REAL_DATA_ABSOLUTE_MAX = 300.0

HERE = os.path.dirname(__file__)
DATASET_PATH = os.path.join(HERE, "datasets", "waiting_time", "appointments.csv")
MODEL_PATH = os.path.join(HERE, "saved", "waiting_time_model.joblib")
METRICS_PATH = os.path.join(HERE, "saved", "waiting_time_metrics.json")

# Keep the input features in the same order during training and prediction.
FEATURE_ORDER = [
    "patients_ahead", "hour_of_day", "day_of_week", "scheduling_interval",
    "age", "sex", "cumulative_duration_ahead",
]

PARAM_GRID = {
    "mlp__hidden_layer_sizes": [(64, 32), (100,), (128, 64)],
    "mlp__alpha": [0.0001, 0.001, 0.01],
    "mlp__learning_rate_init": [0.001, 0.01],
}


def load_and_engineer_features(csv_path=DATASET_PATH):
   
    appt = pd.read_csv(csv_path)
    # Keep only attended appointments for training.
    df = appt[appt["status"] == "attended"].copy()

    
    df["appointment_time_parsed"] = pd.to_datetime(df["appointment_time"], format="%H:%M:%S")
    # Sort appointments by date and time before calculating earlier appointments.
    df = df.sort_values(["appointment_date", "appointment_time_parsed"])
    # Count earlier appointment rows on each date, starting from zero.
    df["patients_ahead"] = df.groupby("appointment_date").cumcount()

    df["hour_of_day"] = df["appointment_time_parsed"].dt.hour
    df["appointment_date_parsed"] = pd.to_datetime(df["appointment_date"])
    df["day_of_week"] = df["appointment_date_parsed"].dt.dayofweek

    df["sex"] = df["sex"].map({"Male": 0, "Female": 1}).fillna(0)

# Calculate the running duration total separately for each date.
# Subtract this appointment's duration to keep only earlier durations.
# This is an input feature, not the final predicted waiting time.
    df["cumulative_duration_ahead"] = (
        df.groupby("appointment_date")["appointment_duration"].cumsum() - df["appointment_duration"]
    )
# Select the input features and target, then remove incomplete rows.
    return df[FEATURE_ORDER + ["waiting_time"]].dropna()


class WaitingTimeModel:
    def __init__(self):
        self.model = None
        self.mae = None
        self.r2 = None
        self.best_params = None
        if os.path.exists(MODEL_PATH):
            bundle = joblib.load(MODEL_PATH)
            self.model = bundle["model"]
            self.mae = bundle.get("mae")
            self.r2 = bundle.get("r2")
            self.best_params = bundle.get("best_params")

    def is_trained(self):
        return self.model is not None

    def train(self, X: np.ndarray, y: np.ndarray, cv_folds=5, verbose=True):
        from sklearn.model_selection import cross_val_score

# use 80% for training and 20% for testing 
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        
        # MLP with two hidden layers (64, 32) is the best-performing model 
        
        best_params = {
            "mlp__hidden_layer_sizes": (64, 32),
            "mlp__alpha": 0.0001,
            "mlp__learning_rate_init": 0.001,
        }

        best_model = Pipeline([
            ("scale", StandardScaler()),
            ("mlp", MLPRegressor(
                hidden_layer_sizes=best_params["mlp__hidden_layer_sizes"],
                alpha=best_params["mlp__alpha"],
                learning_rate_init=best_params["mlp__learning_rate_init"],
                max_iter=500, random_state=42,
            )),
        ])

        cv_scores = cross_val_score(
            best_model, X_train, y_train, cv=cv_folds,
            scoring="neg_mean_absolute_error", n_jobs=-1,
        )
        cv_mae = -cv_scores.mean()

        best_model.fit(X_train, y_train)
        train_preds = best_model.predict(X_train)
        train_mae = mean_absolute_error(y_train, train_preds)
        train_r2 = r2_score(y_train, train_preds)
        preds = best_model.predict(X_test)
        mae = mean_absolute_error(y_test, preds)
        r2 = r2_score(y_test, preds)

        if verbose:
            print(f"Fixed architecture (from model comparison): {best_params}")
            print(f"CV MAE (mean over {cv_folds} folds): {cv_mae:.2f} min")
            print(f"Training MAE: {train_mae:.2f} min | R2: {train_r2:.3f}")
            print(f"Held-out test MAE: {mae:.2f} min | R2: {r2:.3f}")

        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump(
            {"model": best_model, "mae": mae, "r2": r2, "best_params": best_params},
            MODEL_PATH,
        )
        with open(METRICS_PATH, "w") as f:
            json.dump(
                {
                    "model_type": "Neural network (MLPRegressor)",
                    "dataset": "real clinic appointments (86,032 attended visits)",
                    "cv_folds": cv_folds,
                    "cv_mae": cv_mae,
                    "train_mae": train_mae,
                    "train_r2": train_r2,
                    "test_mae": mae,
                    "test_r2": r2,
                    "best_params": best_params,
                    "n_train": len(X_train),
                    "n_test": len(X_test),
                },
                f,
                indent=2,
            )

        self.model, self.mae, self.r2, self.best_params = best_model, mae, r2, best_params
        return {"mae": mae, "r2": r2, "best_params": best_params}

    def predict(self, features: dict) -> float:
        if not self.is_trained():
            return round(features["patients_ahead"] * 5, 1)
        clamped = dict(features)
        clamped["hour_of_day"] = max(TRAINED_HOUR_MIN, min(TRAINED_HOUR_MAX, features["hour_of_day"]))
        clamped["day_of_week"] = max(TRAINED_DOW_MIN, min(TRAINED_DOW_MAX, features["day_of_week"]))
        x = np.array([[clamped[k] for k in FEATURE_ORDER]])
        raw = float(self.model.predict(x)[0])
        raw = max(0.0, min(raw, REAL_DATA_ABSOLUTE_MAX))
        if features["patients_ahead"] == 0:
            raw = min(raw, ZERO_QUEUE_OBSERVED_MAX)
        return round(raw, 1)


_instance = None


def get_waiting_time_model():
    global _instance
    if _instance is None:
        _instance = WaitingTimeModel()
    return _instance


if __name__ == "__main__":
   
    data = load_and_engineer_features()
    print(f"Loaded {len(data)} real attended appointments.")
    print(data.head())
    print(data.describe())

    X = data[FEATURE_ORDER].to_numpy()
    y = data["waiting_time"].to_numpy()
    print("X shape:", X.shape, " y shape:", y.shape)

    WaitingTimeModel().train(X, y)