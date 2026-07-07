CREATE TABLE user_wallets (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    balance_usd NUMERIC(10, 2) NOT NULL DEFAULT 1.50,
    status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE token_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    model_used TEXT,
    tokens_burned INTEGER,
    credit_deducted NUMERIC(10, 2)
);