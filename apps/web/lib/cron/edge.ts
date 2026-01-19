export const qstashEdge = {
    publishJSON: async ({
        url,
        body,
        headers,
        callback,
        failureCallback,
        delay,
    }: {
        url: string;
        body: any;
        headers?: Record<string, string>;
        callback?: string;
        failureCallback?: string;
        delay?: number;
    }) => {
        const qstashToken = process.env.QSTASH_TOKEN;

        if (!qstashToken) {
            console.warn("QSTASH_TOKEN is not set, skipping QStash publish");
            return { messageId: null };
        }

        const res = await fetch(
            `https://qstash.upstash.io/v2/publish/${url}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${qstashToken}`,
                    ...(headers || {}),
                    ...(callback && { "Upstash-Callback": callback }),
                    ...(failureCallback && { "Upstash-Failure-Callback": failureCallback }),
                    ...(delay && { "Upstash-Delay": `${delay}s` }),
                },
                body: JSON.stringify(body),
            }
        );

        if (!res.ok) {
            console.error(
                `Failed to publish to QStash: ${res.status} ${res.statusText}`
            );
            return { messageId: null };
        }

        const data = await res.json();
        return { messageId: data.messageId };
    },
};
