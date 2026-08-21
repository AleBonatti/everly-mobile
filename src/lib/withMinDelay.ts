export async function withMinDelay<T>(promise: Promise<T>, minMs = 500): Promise<T> {
    const [result] = await Promise.allSettled([promise, new Promise((resolve) => setTimeout(resolve, minMs))]);

    if (result.status === "rejected") {
        throw result.reason;
    }

    return result.value;
}
