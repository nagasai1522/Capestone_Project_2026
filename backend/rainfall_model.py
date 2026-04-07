# rainfall_model.py
import os
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

class RainfallPredictor:
    _instance = None

    @classmethod
    def get_instance(cls):
        """Returns the same instance every time – model loads only once"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        # CSV is expected to be in the same folder as this file
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.csv_path = os.path.join(base_dir, "Sub_Division_IMD_2017.csv")

        if not os.path.exists(self.csv_path):
            raise FileNotFoundError(
                f"Rainfall CSV not found at:\n  {self.csv_path}\n"
                "→ Please place 'Sub_Division_IMD_2017.csv' in the same folder as this script."
            )

        print(f"[RainfallPredictor] Loading data from: {self.csv_path}")
        self._load_and_train()

    def _load_and_train(self):
        df = pd.read_csv(self.csv_path)

        required = {
            "SUBDIVISION", "YEAR", "JAN", "FEB", "MAR", "APR", "MAY",
            "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "ANNUAL"
        }
        if not required.issubset(df.columns):
            missing = required - set(df.columns)
            raise ValueError(f"CSV is missing required columns: {missing}")

        # Remove rows that have missing values in any rainfall column
        target_cols = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC","ANNUAL"]
        df_clean = df.dropna(subset=target_cols).copy()

        print(f"[RainfallPredictor] Training on {len(df_clean)} complete rows")

        features = df_clean[["SUBDIVISION", "YEAR"]]
        target   = df_clean[target_cols]

        preprocessor = ColumnTransformer([
            ("ohe", OneHotEncoder(handle_unknown="ignore"), ["SUBDIVISION"]),
            ("pass", "passthrough", ["YEAR"]),
        ])

        regressor = LinearRegression()
        self.pipeline = Pipeline([
            ("preprocessor", preprocessor),
            ("regressor",    regressor)
        ])

        self.pipeline.fit(features, target)
        self.months = target_cols

        print("[RainfallPredictor] Model trained successfully")

    def predict(self, subdivision: str, year: int) -> dict:
        X = pd.DataFrame({"SUBDIVISION": [subdivision], "YEAR": [year]})
        pred = self.pipeline.predict(X)[0]

        result = {m: round(float(v), 1) for m, v in zip(self.months, pred)}

        # Add seasonal totals
        result["Jan-Feb"] = round(result["JAN"] + result["FEB"], 1)
        result["Mar-May"] = round(result["MAR"] + result["APR"] + result["MAY"], 1)
        result["Jun-Sep"] = round(result["JUN"] + result["JUL"] + result["AUG"] + result["SEP"], 1)
        result["Oct-Dec"] = round(result["OCT"] + result["NOV"] + result["DEC"], 1)

        return result