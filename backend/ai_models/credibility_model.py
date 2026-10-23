import os
import json
import ast
import joblib
import traceback
import numpy as np
import pandas as pd
from sklearn.neural_network import MLPRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

HERE = os.path.dirname(__file__)
DATASET_PATH = os.path.join(HERE, "datasets", "credibility", "ratemds_reviews.csv")
MODEL_PATH = os.path.join(HERE, "saved", "credibility_model.joblib")
METRICS_PATH = os.path.join(HERE, "saved", "credibility_metrics.json")

FEATURE_ORDER = ["avg_sentiment", "review_count", "rating_consistency"]

# Lexicon
POSITIVE_WORDS = {
    "fabulous", "wonderful", "great", "excellent", "amazing", "caring", "kind",
    "friendly", "professional", "helpful", "thorough", "patient", "knowledgeable",
    "attentive", "compassionate", "best", "trust", "recommend", "gentle", "punctual",
}
NEGATIVE_WORDS = {
    "rude", "unprofessional", "dismissive", "careless", "arrogant", "terrible",
    "poor", "awful", "rushed", "late", "unhelpful", "worst", "avoid", "cold",
    "condescending", "impatient", "ignored",
}

# Convert a stored review token list into Python values.
def _tokens_from_review_cell(cell):
    try:
        return ast.literal_eval(cell)
    except (ValueError, SyntaxError):
        return str(cell).split()

def _sentiment(tokens):
    if not tokens:
        return 0.0
    pos = sum(1 for t in tokens if t in POSITIVE_WORDS)
    neg = sum(1 for t in tokens if t in NEGATIVE_WORDS)
    if pos + neg == 0:
        return 0.0
    # Calculate sentiment from the balance of positive and negative word hits.
    return (pos - neg) / (pos + neg)

def load_and_engineer_features(csv_path=DATASET_PATH):
    df = pd.read_csv(csv_path)
    df["tokens"] = df["review"].apply(_tokens_from_review_cell)
    df["sentiment"] = df["tokens"].apply(_sentiment)
    # Average the four rating dimensions into one rating per review.
    df["overall_rating"] = df[["S", "P", "H", "K"]].mean(axis=1)

# Combine each doctor's reviews into one row of features and a target.
    grouped = df.groupby("doc_id").agg(
        avg_sentiment=("sentiment", "mean"),
        review_count=("r_id", "count"),
        rating_std=("overall_rating", "std"),
        target_avg_rating=("overall_rating", "mean"),
    )
    
    # Fill missing std with 2.0 (max theoretical std on 1-5 scale)
    grouped["rating_std"] = grouped["rating_std"].fillna(2.0)
    # Convert rating variation into a consistency feature.
    # Training uses sample standard deviation and does not clip this feature.
    grouped["rating_consistency"] = 1 - (grouped["rating_std"] / 2.0)
    # Convert the doctor's average rating into the target percentage scale score.
    grouped["target_score"] = (grouped["target_avg_rating"] / 5) * 100

    return grouped[FEATURE_ORDER + ["target_score"]].reset_index()

class CredibilityModel:
    def __init__(self):
        self.model = None
        if os.path.exists(MODEL_PATH):
            self.model = joblib.load(MODEL_PATH)["model"]

    def is_trained(self):
        return self.model is not None

    def train(self, X: np.ndarray, y: np.ndarray, cv_folds=5, verbose=True):
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # MLP requires scaling. We use the exact best params from your tuning.
        model = Pipeline([
            ("scale", StandardScaler()),
            ("mlp", MLPRegressor(
                hidden_layer_sizes=(64, 32),
                alpha=5.3572800696018346e-05,
                learning_rate_init=0.0004201672054372534,
                max_iter=2000,  # Increased from 1000 to reduce ConvergenceWarnings
                random_state=42
            ))
        ])

        model.fit(X_train, y_train)

        preds = model.predict(X_test)
        mae = mean_absolute_error(y_test, preds)
        r2 = r2_score(y_test, preds)
        train_preds = model.predict(X_train)
        train_mae = mean_absolute_error(y_train, train_preds)
        train_r2 = r2_score(y_train, train_preds)

        if verbose:
            print("Model: Tuned Neural Network (MLP)")
            print(f"Training MAE: {train_mae:.2f} points | R2: {train_r2:.3f}")
            print(f"Held-out test MAE: {mae:.2f} points | R2: {r2:.3f}")

        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump({"model": model}, MODEL_PATH)
        
        with open(METRICS_PATH, "w") as f:
            json.dump({
                "model_type": "Tuned Neural Network (MLP)",
                "dataset": "real RateMDs reviews",
                "train_mae": train_mae,
                "train_r2": train_r2,
                "test_mae": mae,
                "test_r2": r2,
                "n_train": len(X_train),
                "n_test": len(X_test),
            }, f, indent=2)

        self.model = model
        return {"test_mae": mae, "test_r2": r2}

    def score(self, factors: dict) -> float:
        if self.is_trained():
            x = np.array([[factors[k] for k in FEATURE_ORDER]])
            raw = float(self.model.predict(x)[0])
        else:
            # Fallback heuristic
            norm_sentiment = (factors["avg_sentiment"] + 1) / 2
            raw = norm_sentiment * 70 + min(factors["review_count"], 20) * 1.0 + factors["rating_consistency"] * 20
        # Limit the score to 0–100 and return one decimal place.
        return round(max(0.0, min(100.0, raw)), 1)

_instance = None

def get_credibility_model():
    global _instance
    if _instance is None:
        _instance = CredibilityModel()
    return _instance


if __name__ == "__main__":
    try:
        print("Loading data...")
        data = load_and_engineer_features()
        print(f"Loaded {len(data)} real doctors, aggregated from real reviews.")
        
        X = data[FEATURE_ORDER].to_numpy()
        y = data["target_score"].to_numpy()
        print("X shape:", X.shape, " y shape:", y.shape)

        print("\nStarting MLP training. This may take a few seconds...")
        CredibilityModel().train(X, y)
        
        print("\n✅ Model training completed successfully!")
        
    except Exception as e:
        print("\n❌ An error occurred while running the script:")
        traceback.print_exc()
    finally:
        input("\nPress Enter to exit...")