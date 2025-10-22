package com.stacktrack.catalog;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

@Service
public class SeedCatalogService {

    private final ObjectMapper mapper = new ObjectMapper();
    private final List<CardItem> all;

    public SeedCatalogService() {
        this.all = load();
    }

    private List<CardItem> load() {
        try (InputStream in = getClass().getResourceAsStream("/seed-cards.json")) {
            if (in == null) {
                throw new IllegalStateException(
                        "seed-cards.json not found on classpath (expected in src/main/resources)");
            }
            return mapper.readValue(in, new TypeReference<List<CardItem>>() {
            });
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load seed-cards.json", e);
        }
    }

    public List<CardItem> search(String q, int limit) {
        if (all == null || all.isEmpty())
            return Collections.emptyList();
        final String needle = (q == null) ? "" : q.toLowerCase(Locale.ROOT);
        final int max = Math.min(Math.max(limit, 1), 50);

        return all.stream()
                .filter(c -> needle.isEmpty()
                        || (c.name != null && c.name.toLowerCase(Locale.ROOT).contains(needle))
                        || (c.setName != null && c.setName.toLowerCase(Locale.ROOT).contains(needle))
                        || (c.rarity != null && c.rarity.toLowerCase(Locale.ROOT).contains(needle))
                        || (c.number != null && c.number.toLowerCase(Locale.ROOT).contains(needle)))
                .limit(max)
                .toList();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CardItem {
        public String id;
        public String name;
        public String setName;
        public String imageSmall;
        public String rarity;
        public String number;
        // Optional field present in your JSON; safe to keep. Frontend can ignore it.
        public String setId;

        public CardItem() {
        } // Jackson

        public CardItem(String id, String name, String setName, String imageSmall, String rarity, String number,
                String setId) {
            this.id = id;
            this.name = name;
            this.setName = setName;
            this.imageSmall = imageSmall;
            this.rarity = rarity;
            this.number = number;
            this.setId = setId;
        }
    }
}