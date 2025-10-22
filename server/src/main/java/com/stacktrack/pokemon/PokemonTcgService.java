package com.stacktrack.pokemon;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
public class PokemonTcgService {

    private final String apiKey;
    private final String baseUrl;
    private final HttpClient http;
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
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        // Force IPv4/HTTP1.1 behavior on the client side & set a connect timeout
        this.http = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(6))
                .build();
    }

    public List<SearchItem> search(String q, int limit) throws IOException, InterruptedException {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("POKEMONTCG_API_KEY is not set on the server");
        }

        String encodedQ = URLEncoder.encode(q, StandardCharsets.UTF_8);
        String select = URLEncoder.encode("id,name,set,images,tcgplayer,rarity,number", StandardCharsets.UTF_8);

        URI uri = URI.create(String.format(
                "%s/cards?q=%s&pageSize=%d&select=%s",
                baseUrl, encodedQ, Math.min(Math.max(limit, 1), 20), select));

        // Debug log to see outbound requests in your console
        System.out.println("[PokemonTcgService] GET " + uri);

        HttpRequest req = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(10)) // per-request timeout
                .header("X-Api-Key", apiKey)
                .header("User-Agent", "StackAndTrack/1.0")
                .header("Accept", "application/json")
                .header("Accept-Encoding", "identity") // avoid h2/gzip weirdness
                .GET()
                .build();

        HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());

        System.out.println("[PokemonTcgService] status=" + res.statusCode());

        if (res.statusCode() < 200 || res.statusCode() >= 300) {
            throw new IOException("PokémonTCG.io error " + res.statusCode() + ": " + res.body());
        }

        JsonNode root = mapper.readTree(res.body());
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

    private static String str(JsonNode node, String field) {
        JsonNode v = node.get(field);
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
