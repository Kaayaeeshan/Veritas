
import re


POSITIVE_WORDS = {
    "good", "great", "excellent", "kind", "patient", "clear", "helpful",
    "professional", "caring", "thorough", "polite", "friendly", "amazing",
    "best", "trust", "recommend", "gentle", "attentive", "wonderful",
}
NEGATIVE_WORDS = {
    "bad", "rude", "rushed", "worst", "avoid", "late", "unprofessional",
    "dismissive", "careless", "arrogant", "terrible", "poor", "awful",
    "impatient", "ignored", "delay",
}

NEGATION_WORDS = {"not", "no", "never", "nothing", "without", "hardly"}
NEGATION_WINDOW = 3

_WORD_RE = re.compile(r"[\w']+", re.UNICODE)


def lexicon_sentiment(text: str) -> float:
    """
    Returns a score in [-1, 1]. 0 means neutral / no lexicon hits.
    A sentiment word preceded within NEGATION_WINDOW tokens by a negation
    word (or a contraction like "isn't") has its polarity flipped.
    """
    tokens = _WORD_RE.findall(str(text).lower())
    if not tokens:
        return 0.0

    pos = neg = 0
    for i, tok in enumerate(tokens):
        is_positive = tok in POSITIVE_WORDS
        is_negative = tok in NEGATIVE_WORDS
        if not (is_positive or is_negative):
            continue

        preceding = tokens[max(0, i - NEGATION_WINDOW):i]
        negated = any(w in NEGATION_WORDS or w.endswith("n't") for w in preceding)

        if is_positive:
            neg += negated
            pos += not negated
        else:
            pos += negated
            neg += not negated

    if pos + neg == 0:
        return 0.0
    return (pos - neg) / (pos + neg)


def detect_burst(timestamps, window_seconds=180, min_count=4):
    """
    timestamps: sorted or not list of datetime objects (e.g. all reviews from
    one patient). Returns True if min_count+ fall within any window_seconds
    window — a classic fake-review-farm signal.
    """
    ts = sorted(timestamps)
    for i in range(len(ts)):
        j = i
        while j < len(ts) and (ts[j] - ts[i]).total_seconds() <= window_seconds:
            j += 1
        if j - i >= min_count:
            return True
    return False