package com.stacktrack.api;

import com.stacktrack.catalog.SeedCatalogService;
import com.stacktrack.catalog.SeedCatalogService.CardItem;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final SeedCatalogService catalog;

    public SearchController(SeedCatalogService catalog) {
        this.catalog = catalog;
    }

    @GetMapping("/catalog")
    public ResponseEntity<List<CardItem>> catalog(
            @RequestParam("q") String q,
            @RequestParam(value = "limit", defaultValue = "10") int limit) {

        try {
            // allow empty to just return the first N items (handy for UX)
            final String needle = (q == null) ? "" : q.trim();
            final int safeLimit = Math.min(Math.max(limit, 1), 50);

            List<CardItem> items = catalog.search(needle, safeLimit);
            return ResponseEntity.ok(items);

        } catch (Exception e) {
            // surface an error clearly while still returning 502 like before
            return ResponseEntity.status(502)
                    .header("X-Debug-Msg", e.getClass().getSimpleName() + ": " + e.getMessage())
                    .build();
        }
    }

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("ok");
    }
}