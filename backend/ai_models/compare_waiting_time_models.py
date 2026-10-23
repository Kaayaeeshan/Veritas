import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import Ridge
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, AdaBoostRegressor
from sklearn.neural_network import MLPRegressor

from waiting_time_model import load_and_engineer_features, FEATURE_ORDER


def main():
    data = load_and_engineer_features()
    print(f"Loaded {len(data)} real attended appointments.")
    print(f"Comparing on {len(FEATURE_ORDER)} features: {FEATURE_ORDER}\n")

    X = data[FEATURE_ORDER].to_numpy()
    y = data["waiting_time"].to_numpy()

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    models = {
        "Linear Regression (Ridge + polynomial)": Pipeline([
            ("scale", StandardScaler()),
            ("poly", PolynomialFeatures(degree=2, include_bias=False)),
            ("ridge", Ridge(alpha=1.0)),
        ]),
        "Decision Tree": DecisionTreeRegressor(random_state=42),
        "Random Forest": RandomForestRegressor(n_estimators=100, random_state=42),
        "Gradient Boosting": GradientBoostingRegressor(n_estimators=100, random_state=42),
        "AdaBoost": AdaBoostRegressor(n_estimators=100, random_state=42),
        "Neural Network (MLP)": Pipeline([
            ("scale", StandardScaler()),
            ("mlp", MLPRegressor(hidden_layer_sizes=(64, 32), max_iter=500, random_state=42)),
        ]),
    }

    results = []
    for name, model in models.items():
        model.fit(X_train, y_train)
        train_pred = model.predict(X_train)
        test_pred = model.predict(X_test)

        results.append([
            name,
            mean_absolute_error(y_train, train_pred),
            r2_score(y_train, train_pred),
            mean_absolute_error(y_test, test_pred),
            r2_score(y_test, test_pred),
        ])

    results_df = pd.DataFrame(
        results, columns=["Model", "Train MAE", "Train R2", "Test MAE", "Test R2"]
    )
    results_df = results_df.sort_values(by="Test R2", ascending=False)
    pd.set_option("display.width", 160)
    print(results_df.to_string(index=False))

   

if __name__ == "__main__":
    main()