import time
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import BaggingClassifier, RandomForestClassifier, GradientBoostingClassifier, AdaBoostClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

from fake_review_model import load_train_test, TEXT_COL


def _pipeline(clf):
    return Pipeline([("tfidf", TfidfVectorizer(min_df=2, max_features=5000)), ("clf", clf)])


def main():
    train_df, test_df = load_train_test()
    print(f"Loaded {len(train_df)} real training reviews, {len(test_df)} real test reviews.\n")

    X_train, y_train = train_df[TEXT_COL], train_df["flagged"].to_numpy()
    X_test, y_test = test_df[TEXT_COL], test_df["flagged"].to_numpy()

    models = {
        "Logistic Regression": _pipeline(LogisticRegression(max_iter=1000, class_weight="balanced")),
        "Decision Tree": _pipeline(DecisionTreeClassifier(random_state=42)),
        "Bagging": _pipeline(BaggingClassifier(n_estimators=20, random_state=42, n_jobs=-1)),
        "Random Forest": _pipeline(RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)),
        "Gradient Boosting": _pipeline(GradientBoostingClassifier(n_estimators=50, random_state=42)),
        "AdaBoost": _pipeline(AdaBoostClassifier(n_estimators=50, random_state=42)),
        "Neural Network (MLP)": _pipeline(MLPClassifier(hidden_layer_sizes=(32,), max_iter=200, early_stopping=True, random_state=42)),
    }

    results = []
    for name, model in models.items():
        t0 = time.time()
        model.fit(X_train, y_train)
        train_pred = model.predict(X_train)
        test_pred = model.predict(X_test)
        elapsed = time.time() - t0

        results.append([
            name,
            accuracy_score(y_train, train_pred),
            f1_score(y_train, train_pred, zero_division=0),
            accuracy_score(y_test, test_pred),
            precision_score(y_test, test_pred, zero_division=0),
            recall_score(y_test, test_pred, zero_division=0),
            f1_score(y_test, test_pred, zero_division=0),
        ])
        print(f"  done: {name} ({elapsed:.1f}s)")

    results_df = pd.DataFrame(
        results,
        columns=["Model", "Train Acc", "Train F1", "Test Acc", "Test Prec", "Test Rec", "Test F1"],
    )
    results_df = results_df.sort_values(by="Test F1", ascending=False)
    pd.set_option("display.width", 160)
    print()
    print(results_df.to_string(index=False))

    
if __name__ == "__main__":
    main()