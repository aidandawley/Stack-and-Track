package com.stacktrack.pokemon;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.hc.client5.http.classic.CloseableHttpClient;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ClassicHttpResponse;
import org.apache.hc.core5.http.HttpEntity;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.util.Timeout;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
public class PokemonTcgService {

    private final String apiKey;
    private final String baseUrl;
    private final boolean useWorker;

    private final CloseableHttpClient http;
    private final ObjectMapper mapper = new ObjectMapper();

    public record SearchItem(
            String id,
            String name,
            String setName,
            String imageSmall,
            Double priceUSD,
            String priceUpdatedAt) {
    }

    public PokemonTcgService(
            @Value("${pokemon.api.key:}") String apiKey,
            @Value("${pokemon.api.baseUrl:https://api.pokemontcg.io/v2}") String baseUrl) {

        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.baseUrl = baseUrl.replaceAll("/+$", ""); // trim trailing slash(es)
        this.useWorker = this.baseUrl.contains(".workers.dev");

        // Build an Apache HC5 client with proper Timeout (HC5 uses its own Timeout
        // type)
        RequestConfig rc = RequestConfig.custom()
                .setConnectTimeout(Timeout.ofSeconds(8))
                .setResponseTimeout(Timeout.ofSeconds(15))
                .build();

        this.http = HttpClients.custom()
                .setDefaultRequestConfig(rc)
                .disableContentCompression() // keep things simple; no gzip surprises
                .build();
    }

    public List<SearchItem> search(String q, int limit) throws IOException {
        if (!useWorker && (apiKey == null || apiKey.isBlank())) {
            throw new IllegalStateException("POKEMONTCG_API_KEY is not set on the server");
        }

        String userQ = (q == null) ? "" : q.trim();
        boolean looksAdvanced = userQ.contains(":") || userQ.contains("*") || userQ.contains("\"");
        String lucene = looksAdvanced ? userQ : ("name:" + userQ + "*");

        int safeLimit = Math.min(Math.max(limit, 1), 50);

        String encodedQ = URLEncoder.encode(lucene, StandardCharsets.UTF_8);
        String select = URLEncoder.encode("id,name,set,images,tcgplayer,rarity,number", StandardCharsets.UTF_8);

        // baseUrl already includes /v2 when pointing at the worker
        String full = String.format("%s/cards?q=%s&pageSize=%d&select=%s", baseUrl, encodedQ, safeLimit, select);
        URI uri = URI.create(full);

        HttpGet get = new HttpGet(uri);
        get.addHeader("User-Agent", "StackAndTrack/1.0");
        get.addHeader("Accept", "application/json");
        get.addHeader("Accept-Encoding", "identity"); // avoid gzip edge-cases

        if (!useWorker && !apiKey.isBlank()) {
            get.addHeader("X-Api-Key", apiKey);
        }

        IOException last = null;

        for (int attempt = 1; attempt <= 2; attempt++) {
            try (ClassicHttpResponse res = (ClassicHttpResponse) http.executeOpen(null, get, null).getResult()) {
                int code = res.getCode();
                // System.out.println("[PokemonTcgService] status=" + code + " attempt=" +
                // attempt);

                HttpEntity entity = res.getEntity();
                String body = entity != null ? EntityUtils.toString(entity, StandardCharsets.UTF_8) : "";

                if (code >= 200 && code < 300) {
                    JsonNode root = mapper.readTree(body);
                    JsonNode data = root.get("data");

                    List<SearchItem> out = new ArrayList<>();
                    if (data != null && data.isArray()) {
                        for (JsonNode card : data) {
                            String id = str(card, "id");
                            String name = str(card, "name");
                            String setName = card.path("set").path("name").asText(null);
                            String imageSmall = card.path("images").path("small").asText(null);

                            JsonNode tcg = card.path("tcgplayer");
                            String updatedAt = str(tcg, "updatedAt");
                            Double price = pickPriceUSD(tcg.path("prices"));

                            out.add(new SearchItem(id, name, setName, imageSmall, price, updatedAt));
                        }
                    }
                    return out;
                }

                last = new IOException("PokémonTCG error " + code + ": " + body);
            } catch (IOException io) {
                last = io;
                // System.out.println("[PokemonTcgService] IOException attempt=" + attempt + "
                // msg=" + io.getMessage());
                try {
                    Thread.sleep(Duration.ofMillis(250));
                } catch (InterruptedException ignored) {
                }
            }
        }

        throw last != null ? last : new IOException("Unknown error contacting PokémonTCG");
    }

    private static String str(JsonNode node, String field) {
        JsonNode v = node != null ? node.get(field) : null;
        return v != null && !v.isNull() ? v.asText() : null;
    }

    private static Double pickPriceUSD(JsonNode prices) {
        if (prices == null || prices.isMissingNode())
            return null;
        Double p;
        p = market(prices.path("holofoil"));
        if (p != null)
            return p;
        p = market(prices.path("normal"));
        if (p != null)
            return p;
        p = market(prices.path("reverseHolofoil"));
        if (p != null)
            return p;
        p = market(prices.path("1stEditionNormal"));
        if (p != null)
            return p;
        return null;
    }

    private static Double market(JsonNode node) {
        if (node == null || node.isMissingNode())
            return null;
        JsonNode m = node.get("market");
        return (m != null && m.isNumber()) ? m.asDouble() : null;
    }
}