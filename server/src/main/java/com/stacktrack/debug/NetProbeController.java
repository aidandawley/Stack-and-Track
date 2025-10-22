// server/src/main/java/com/stacktrack/debug/NetProbeController.java
package com.stacktrack.debug;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class NetProbeController {

    private final HttpClient http = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    private Map<String, Object> tryFetch(String url) {
        var out = new LinkedHashMap<String, Object>();
        out.put("url", url);
        try {
            var req = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(20)) // little more room
                    .header("Accept", "application/json")
                    .header("Accept-Encoding", "identity") // avoid gzip weirdness
                    .GET()
                    .build();
            var t0 = Instant.now();
            var res = http.send(req, HttpResponse.BodyHandlers.ofString());
            var ms = Duration.between(t0, Instant.now()).toMillis();
            out.put("status", res.statusCode());
            out.put("elapsedMs", ms);
            String body = res.body() == null ? "" : res.body();
            out.put("sample", body.length() > 200 ? body.substring(0, 200) + "…" : body);
        } catch (Throwable e) {
            out.put("error", e.getClass().getName());
            out.put("message", e.getMessage());
        }
        return out;
    }

    @GetMapping("/api/debug/worker-health")
    public Map<String, Object> workerHealth() {
        return tryFetch("https://ptcg-proxy.stackandtrack.workers.dev/health");
    }

    @GetMapping("/api/debug/worker-sets1")
    public Map<String, Object> workerSets() {
        return tryFetch("https://ptcg-proxy.stackandtrack.workers.dev/v2/sets?pageSize=1");
    }

    @GetMapping("/api/debug/worker-cards1")
    public Map<String, Object> workerCards() {
        return tryFetch("https://ptcg-proxy.stackandtrack.workers.dev/v2/cards?q=name:pika*&pageSize=1&select=id,name");
    }
}