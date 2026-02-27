export async function fetchBaseChainData() {
    try {
        const rpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
        const res = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
            next: { revalidate: 12 }
        });

        if (!res.ok) {
            return { latestBlock: 'N/A', status: `UNAUTHORIZED_OR_ERROR` };
        }

        const data = await res.json();
        return { latestBlock: parseInt(data.result, 16), status: 'OPTIMAL' };
    } catch {
        return { latestBlock: 'OFFLINE', status: 'DATA_UNAVAILABLE' };
    }
}
