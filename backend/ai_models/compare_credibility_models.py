import pandas as pd
from sklearn.model_selection import (
    train_test_split,
    KFold,
    GridSearchCV,
    RandomizedSearchCV,
)
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.linear_model import Ridge
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import (
    RandomForestRegressor,
    GradientBoostingRegressor,
    AdaBoostRegressor,
)
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from scipy.stats import randint, uniform, loguniform


from credibility_model import load_and_engineer_features, FEATURE_ORDER, ALPHA_CANDIDATES


def main():
    print("Loading data...")
    data = load_and_engineer_features()
    print(f"Loaded {len(data)} real doctors, aggregated from real RateMDs reviews.\n")

    X = data[FEATURE_ORDER].to_numpy()
    y = data["target_score"].to_numpy()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    cv = KFold(n_splits=5, shuffle=True, random_state=42)

    # Use "r2" to optimize R2 or "neg_mean_absolute_error" to optimize MAE
    scoring = "r2"

    ridge_pipe = Pipeline([
        ("scale", StandardScaler()),
        ("ridge", Ridge()),
    ])

    mlp_pipe = Pipeline([
        ("scale", StandardScaler()),
        ("mlp", MLPRegressor(max_iter=1000, random_state=42)),
    ])

    # Added verbose=1 to all searches to show progress in the terminal
    searches = {
        "Ridge": GridSearchCV(
            ridge_pipe,
            param_grid={
                "ridge__alpha": ALPHA_CANDIDATES,
            },
            cv=cv,
            scoring=scoring,
            n_jobs=-1,
            verbose=1
        ),

        "Decision Tree": GridSearchCV(
            DecisionTreeRegressor(random_state=42),
            param_grid={
                "max_depth": [None, 3, 5, 7, 10, 15, 20],
                "min_samples_split": [2, 5, 10, 20],
                "min_samples_leaf": [1, 2, 4, 8],
                "max_features": [None, "sqrt", "log2"],
            },
            cv=cv,
            scoring=scoring,
            n_jobs=-1,
            verbose=1
        ),

        "Random Forest": RandomizedSearchCV(
            RandomForestRegressor(random_state=42),
            param_distributions={
                "n_estimators": randint(100, 500),
                "max_depth": [None, 5, 10, 15, 20, 30],
                "min_samples_split": randint(2, 20),
                "min_samples_leaf": randint(1, 10),
                "max_features": [1.0, "sqrt", "log2"],
            },
            n_iter=40,
            cv=cv,
            scoring=scoring,
            n_jobs=-1,
            random_state=42,
            verbose=1
        ),

        "Gradient Boosting": RandomizedSearchCV(
            GradientBoostingRegressor(random_state=42),
            param_distributions={
                "n_estimators": randint(100, 500),
                "learning_rate": loguniform(0.01, 0.3),
                "max_depth": randint(2, 8),
                "min_samples_split": randint(2, 20),
                "min_samples_leaf": randint(1, 10),
                "subsample": uniform(0.6, 0.4),
            },
            n_iter=40,
            cv=cv,
            scoring=scoring,
            n_jobs=-1,
            random_state=42,
            verbose=1
        ),

        "AdaBoost": RandomizedSearchCV(
            AdaBoostRegressor(random_state=42),
            param_distributions={
                "n_estimators": randint(50, 500),
                "learning_rate": loguniform(0.01, 1.0),
                "loss": ["linear", "square", "exponential"],
            },
            n_iter=30,
            cv=cv,
            scoring=scoring,
            n_jobs=-1,
            random_state=42,
            verbose=1
        ),

        "Neural Network (MLP)": RandomizedSearchCV(
            mlp_pipe,
            param_distributions={
                "mlp__hidden_layer_sizes": [
                    (32,),
                    (64,),
                    (32, 16),
                    (64, 32),
                    (64, 32, 16),
                ],
                "mlp__alpha": loguniform(1e-5, 1e-1),
                "mlp__learning_rate_init": loguniform(1e-4, 1e-2),
                "mlp__max_iter": [500, 1000],
            },
            n_iter=30,
            cv=cv,
            scoring=scoring,
            n_jobs=-1,
            random_state=42,
            verbose=1
        ),
    }

    results = []

    print("\nStarting hyperparameter tuning. This may take several minutes...")
    for name, search in searches.items():
        print(f"\n{'='*40}")
        print(f"Tuning {name}...")
        print(f"{'='*40}")
        
        search.fit(X_train, y_train)
        best_model = search.best_estimator_

        train_pred = best_model.predict(X_train)
        test_pred = best_model.predict(X_test)

        results.append([
            name,
            mean_absolute_error(y_train, train_pred),
            r2_score(y_train, train_pred),
            mean_absolute_error(y_test, test_pred),
            r2_score(y_test, test_pred),
        ])

        print(f"\nBest params for {name}: {search.best_params_}")
        print(f"Best CV score: {search.best_score_:.4f}")

    results_df = pd.DataFrame(
        results,
        columns=["Model", "Train MAE", "Train R2", "Test MAE", "Test R2"],
    )

    results_df = results_df.sort_values(by="Test R2", ascending=False)
    pd.set_option("display.width", 160)
    
    print("\n" + "="*60)
    print("FINAL RESULTS")
    print("="*60)
    print(results_df.to_string(index=False))


if __name__ == "__main__":
    try:
        main()
        print("\n✅ Script completed successfully!")
    except Exception as e:
        print("\n❌ An error occurred while running the script:")
        print(e)
    finally:
        # This stops CMD from closing immediately
        input("\nPress Enter to exit...")