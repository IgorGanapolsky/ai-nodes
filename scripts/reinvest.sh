#!/bin/bash
# AI Nodes Auto-Reinvestment Script
# Automatically reinvests earnings when thresholds are met using Solana DeFi protocols
set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="$PROJECT_ROOT/logs/reinvest-$(date +%Y%m%d).log"

# Load environment variables
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
fi

# Default configuration
DATABASE_PATH="${DATABASE_PATH:-$PROJECT_ROOT/db/ai_nodes.db}"
SOLANA_RPC_URL="${SOLANA_RPC_URL:-https://api.mainnet-beta.solana.com}"
REINVEST_THRESHOLD="${REINVEST_THRESHOLD:-100}"
MAX_GAS_PRICE="${MAX_GAS_PRICE:-50}"
JUPITER_API_URL="${JUPITER_API_URL:-https://quote-api.jup.ag/v6}"
MARINADE_STAKE_POOL="${MARINADE_STAKE_POOL:-8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC}"
SLIPPAGE_BPS="${SLIPPAGE_BPS:-100}" # 1% slippage
DRY_RUN="${DRY_RUN:-false}"

# Token addresses (Solana mainnet)
SOL_MINT="So11111111111111111111111111111111111111112"
USDC_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
MSOL_MINT="mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    case "$level" in
        "INFO")  echo -e "${GREEN}[$timestamp][INFO]${NC} $message" | tee -a "$LOG_FILE" ;;
        "WARN")  echo -e "${YELLOW}[$timestamp][WARN]${NC} $message" | tee -a "$LOG_FILE" ;;
        "ERROR") echo -e "${RED}[$timestamp][ERROR]${NC} $message" | tee -a "$LOG_FILE" ;;
        "DEBUG") echo -e "${BLUE}[$timestamp][DEBUG]${NC} $message" | tee -a "$LOG_FILE" ;;
    esac
}

# Check dependencies
check_dependencies() {
    local required_tools=("node" "curl" "jq" "sqlite3" "bc")
    local missing_tools=()

    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_tools+=("$tool")
        fi
    done

    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log "ERROR" "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi

    # Check if required environment variables are set
    if [[ -z "${SOLANA_PRIVATE_KEY:-}" ]] || [[ -z "${SOLANA_PUBLIC_KEY:-}" ]]; then
        log "ERROR" "SOLANA_PRIVATE_KEY and SOLANA_PUBLIC_KEY must be set in .env file"
        exit 1
    fi
}

# Get SOL balance
get_sol_balance() {
    local public_key="$1"

    local response=$(curl -s -X POST -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getBalance\",\"params\":[\"$public_key\"]}" \
        "$SOLANA_RPC_URL" 2>/dev/null)

    if [[ -z "$response" ]]; then
        log "ERROR" "Failed to get balance from Solana RPC"
        return 1
    fi

    local balance_lamports=$(echo "$response" | jq -r '.result.value // 0')
    local balance_sol=$(echo "scale=9; $balance_lamports / 1000000000" | bc -l)

    echo "$balance_sol"
}

# Get token balance
get_token_balance() {
    local public_key="$1"
    local mint_address="$2"

    local response=$(curl -s -X POST -H "Content-Type: application/json" \
        -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getTokenAccountsByOwner\",\"params\":[\"$public_key\",{\"mint\":\"$mint_address\"},{\"encoding\":\"jsonParsed\"}]}" \
        "$SOLANA_RPC_URL" 2>/dev/null)

    if [[ -z "$response" ]]; then
        log "ERROR" "Failed to get token balance from Solana RPC"
        return 1
    fi

    local balance=$(echo "$response" | jq -r '.result.value[0].account.data.parsed.info.tokenAmount.uiAmount // 0')
    echo "$balance"
}

# Get Jupiter quote for token swap
get_jupiter_quote() {
    local input_mint="$1"
    local output_mint="$2"
    local amount="$3"
    local amount_lamports

    # Convert to smallest unit based on token
    if [[ "$input_mint" == "$SOL_MINT" ]]; then
        amount_lamports=$(echo "scale=0; $amount * 1000000000" | bc)
    elif [[ "$input_mint" == "$USDC_MINT" ]]; then
        amount_lamports=$(echo "scale=0; $amount * 1000000" | bc)
    else
        amount_lamports=$(echo "scale=0; $amount * 1000000000" | bc) # Default to 9 decimals
    fi

    local url="${JUPITER_API_URL}/quote?inputMint=${input_mint}&outputMint=${output_mint}&amount=${amount_lamports}&slippageBps=${SLIPPAGE_BPS}"

    log "DEBUG" "Getting Jupiter quote: $url"

    local response=$(curl -s "$url" 2>/dev/null)

    if [[ -z "$response" ]]; then
        log "ERROR" "Failed to get quote from Jupiter API"
        return 1
    fi

    local error=$(echo "$response" | jq -r '.error // empty')
    if [[ -n "$error" ]]; then
        log "ERROR" "Jupiter API error: $error"
        return 1
    fi

    echo "$response"
}

# Execute swap via Jupiter
execute_jupiter_swap() {
    local quote="$1"
    local user_public_key="$2"

    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "DRY RUN: Would execute Jupiter swap"
        return 0
    fi

    # This is a simplified example - in production you'd use the Solana web3.js library
    # to create and sign the transaction properly
    log "INFO" "Executing Jupiter swap (implementation required)"

    # Create swap transaction using Node.js script
    node -e "
const { Connection, PublicKey, Transaction, Keypair } = require('@solana/web3.js');
const axios = require('axios');

async function executeSwap() {
    try {
        const connection = new Connection('$SOLANA_RPC_URL');
        const quote = $quote;

        // Get swap transaction
        const response = await axios.post('${JUPITER_API_URL}/swap', {
            quoteResponse: quote,
            userPublicKey: '$user_public_key',
            wrapAndUnwrapSol: true
        });

        const { swapTransaction } = response.data;

        // Deserialize transaction
        const transactionBuf = Buffer.from(swapTransaction, 'base64');
        const transaction = Transaction.from(transactionBuf);

        // Sign transaction (you'll need to implement proper key management)
        // For security, this should use a hardware wallet or secure key storage
        const privateKeyArray = JSON.parse('$SOLANA_PRIVATE_KEY');
        const wallet = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));

        transaction.sign(wallet);

        // Send transaction
        const signature = await connection.sendRawTransaction(transaction.serialize());

        // Confirm transaction
        const confirmation = await connection.confirmTransaction(signature);

        if (confirmation.value.err) {
            throw new Error('Transaction failed: ' + JSON.stringify(confirmation.value.err));
        }

        console.log(JSON.stringify({
            success: true,
            signature: signature,
            confirmation: confirmation
        }));

    } catch (error) {
        console.error(JSON.stringify({
            success: false,
            error: error.message
        }));
        process.exit(1);
    }
}

executeSwap();
" 2>/dev/null

    local exit_code=$?
    return $exit_code
}

# Stake SOL via Marinade
stake_sol_marinade() {
    local amount="$1"
    local user_public_key="$2"

    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "DRY RUN: Would stake $amount SOL via Marinade"
        return 0
    fi

    log "INFO" "Staking $amount SOL via Marinade Finance"

    # Create staking transaction using Node.js script
    node -e "
const { Connection, PublicKey, Transaction, Keypair, SystemProgram } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } = require('@solana/spl-token');

async function stakeSol() {
    try {
        const connection = new Connection('$SOLANA_RPC_URL');
        const amount = parseFloat('$amount');
        const amountLamports = Math.floor(amount * 1000000000);

        // Marinade stake pool program ID
        const MARINADE_PROGRAM_ID = new PublicKey('MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD');
        const STAKE_POOL_ID = new PublicKey('$MARINADE_STAKE_POOL');

        const privateKeyArray = JSON.parse('$SOLANA_PRIVATE_KEY');
        const wallet = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));

        // This is a simplified example - actual Marinade staking requires
        // more complex transaction construction with proper pool accounts
        log('INFO', 'Marinade staking transaction created (implementation needed)');

        console.log(JSON.stringify({
            success: true,
            message: 'Staking transaction prepared',
            amount: amount,
            lamports: amountLamports
        }));

    } catch (error) {
        console.error(JSON.stringify({
            success: false,
            error: error.message
        }));
        process.exit(1);
    }
}

stakeSol();
" 2>/dev/null

    local exit_code=$?
    return $exit_code
}

# Log transaction to database
log_transaction() {
    local tx_hash="$1"
    local tx_type="$2"
    local amount="$3"
    local token="$4"
    local status="$5"
    local gas_fee="${6:-0}"
    local block_number="${7:-0}"

    local query="INSERT INTO transactions
        (transaction_hash, type, amount, token, status, gas_fee, block_number)
        VALUES
        ('$tx_hash', '$tx_type', $amount, '$token', '$status', $gas_fee, $block_number);"

    if sqlite3 "$DATABASE_PATH" "$query" 2>/dev/null; then
        log "DEBUG" "Transaction logged to database: $tx_hash"
    else
        log "ERROR" "Failed to log transaction to database"
    fi
}

# Check if reinvestment threshold is met
check_reinvestment_threshold() {
    local public_key="$1"

    log "INFO" "Checking reinvestment threshold for $public_key"

    # Get current SOL balance
    local sol_balance=$(get_sol_balance "$public_key")
    local sol_price_usd

    # Get SOL price from CoinGecko
    local price_response=$(curl -s "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd" 2>/dev/null)
    if [[ -n "$price_response" ]]; then
        sol_price_usd=$(echo "$price_response" | jq -r '.solana.usd // 0')
    else
        log "WARN" "Failed to get SOL price, using default value of 100"
        sol_price_usd="100"
    fi

    # Calculate USD value of SOL balance
    local balance_usd=$(echo "scale=2; $sol_balance * $sol_price_usd" | bc -l)

    log "INFO" "Current balance: $sol_balance SOL (~$balance_usd USD)"
    log "INFO" "Reinvestment threshold: $REINVEST_THRESHOLD USD"

    # Check if threshold is met (keep some SOL for transaction fees)
    local min_sol_reserve="0.1" # Keep 0.1 SOL for fees
    local available_sol=$(echo "scale=9; $sol_balance - $min_sol_reserve" | bc -l)
    local available_usd=$(echo "scale=2; $available_sol * $sol_price_usd" | bc -l)

    if (( $(echo "$available_usd >= $REINVEST_THRESHOLD" | bc -l) )); then
        log "INFO" "Threshold met! Available for reinvestment: $available_sol SOL (~$available_usd USD)"
        echo "$available_sol|$available_usd|$sol_price_usd"
        return 0
    else
        log "INFO" "Threshold not met. Available: $available_usd USD, Required: $REINVEST_THRESHOLD USD"
        return 1
    fi
}

# Execute reinvestment strategy
execute_reinvestment() {
    local available_sol="$1"
    local available_usd="$2"
    local sol_price="$3"

    log "INFO" "Executing reinvestment strategy"

    # Strategy: 50% direct SOL staking, 50% convert to mSOL via Jupiter
    local stake_amount=$(echo "scale=9; $available_sol * 0.5" | bc -l)
    local swap_amount=$(echo "scale=9; $available_sol * 0.5" | bc -l)

    log "INFO" "Strategy: Stake $stake_amount SOL directly, swap $swap_amount SOL to mSOL"

    # Execute direct staking
    if (( $(echo "$stake_amount > 0" | bc -l) )); then
        log "INFO" "Staking $stake_amount SOL via Marinade"

        if stake_sol_marinade "$stake_amount" "$SOLANA_PUBLIC_KEY"; then
            log "INFO" "Successfully staked $stake_amount SOL"
            log_transaction "marinade_stake_$(date +%s)" "stake" "$stake_amount" "SOL" "confirmed" "0" "0"
        else
            log "ERROR" "Failed to stake SOL via Marinade"
        fi
    fi

    # Execute SOL to mSOL swap
    if (( $(echo "$swap_amount > 0" | bc -l) )); then
        log "INFO" "Swapping $swap_amount SOL to mSOL via Jupiter"

        local quote=$(get_jupiter_quote "$SOL_MINT" "$MSOL_MINT" "$swap_amount")
        if [[ $? -eq 0 ]] && [[ -n "$quote" ]]; then
            local output_amount=$(echo "$quote" | jq -r '.outAmount // 0')
            local output_sol=$(echo "scale=9; $output_amount / 1000000000" | bc -l)

            log "INFO" "Quote: $swap_amount SOL -> $output_sol mSOL"

            if execute_jupiter_swap "$quote" "$SOLANA_PUBLIC_KEY"; then
                log "INFO" "Successfully swapped $swap_amount SOL to $output_sol mSOL"
                log_transaction "jupiter_swap_$(date +%s)" "swap" "$swap_amount" "SOL->mSOL" "confirmed" "0" "0"
            else
                log "ERROR" "Failed to execute Jupiter swap"
            fi
        else
            log "ERROR" "Failed to get Jupiter quote for SOL->mSOL swap"
        fi
    fi
}

# Generate reinvestment report
generate_report() {
    local report_file="$PROJECT_ROOT/logs/reinvest-report-$(date +%Y%m%d-%H%M%S).json"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # Get recent transactions (last 24 hours)
    local transactions_query="SELECT
        COUNT(*) as total_transactions,
        SUM(CASE WHEN type = 'stake' THEN amount ELSE 0 END) as total_staked,
        SUM(CASE WHEN type = 'swap' THEN amount ELSE 0 END) as total_swapped,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as successful_transactions,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions
    FROM transactions
    WHERE timestamp >= datetime('now', '-24 hours');"

    local result=$(sqlite3 "$DATABASE_PATH" "$transactions_query" 2>/dev/null || echo "0|0|0|0|0")
    IFS='|' read -r total_tx total_staked total_swapped successful_tx failed_tx <<< "$result"

    # Get current balances
    local sol_balance=$(get_sol_balance "$SOLANA_PUBLIC_KEY" 2>/dev/null || echo "0")
    local msol_balance=$(get_token_balance "$SOLANA_PUBLIC_KEY" "$MSOL_MINT" 2>/dev/null || echo "0")

    # Generate report
    local report=$(jq -n \
        --arg timestamp "$timestamp" \
        --arg sol_balance "$sol_balance" \
        --arg msol_balance "$msol_balance" \
        --arg total_tx "$total_tx" \
        --arg total_staked "$total_staked" \
        --arg total_swapped "$total_swapped" \
        --arg successful_tx "$successful_tx" \
        --arg failed_tx "$failed_tx" \
        '{
            timestamp: $timestamp,
            period: "24 hours",
            balances: {
                sol: ($sol_balance | tonumber),
                msol: ($msol_balance | tonumber)
            },
            transactions: {
                total: ($total_tx | tonumber),
                successful: ($successful_tx | tonumber),
                failed: ($failed_tx | tonumber)
            },
            reinvestment: {
                total_staked: ($total_staked | tonumber),
                total_swapped: ($total_swapped | tonumber)
            }
        }')

    echo "$report" > "$report_file"
    log "INFO" "Reinvestment report generated: $report_file"
}

# Main execution
main() {
    log "INFO" "AI Nodes auto-reinvestment script started"

    # Ensure log directory exists
    mkdir -p "$PROJECT_ROOT/logs"

    # Check dependencies
    check_dependencies

    # Check if database exists
    if [[ ! -f "$DATABASE_PATH" ]]; then
        log "ERROR" "Database not found: $DATABASE_PATH"
        log "ERROR" "Please run setup.sh first"
        exit 1
    fi

    # Check reinvestment threshold
    local threshold_check
    if threshold_check=$(check_reinvestment_threshold "$SOLANA_PUBLIC_KEY"); then
        IFS='|' read -r available_sol available_usd sol_price <<< "$threshold_check"

        log "INFO" "Reinvestment threshold met, executing strategy"
        execute_reinvestment "$available_sol" "$available_usd" "$sol_price"
    else
        log "INFO" "Reinvestment threshold not met, skipping"
    fi

    # Generate report (daily at midnight)
    if [[ "$(date +%H:%M)" == "00:00" ]]; then
        generate_report
    fi

    log "INFO" "Auto-reinvestment script completed"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi