package com.stacktrack.api;

import com.stacktrack.pokemon.PokemonTcgService;
import com.stacktrack.pokemon.PokemonTcgService.SearchItem;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final PokemonTcgService pokemon;

    public SearchController(PokemonTcgService pokemon) {
        this.pokemon = pokemon;
    }

    @GetMapping("/ping")
    public String ping() {
        return "ok";
    }

    @GetMapping("/catalog")
    public ResponseEntity<List<SearchItem>> catalog(
            @RequestParam("q") String q,
            @RequestParam(value = "limit", defaultValue = "10") int limit,
            @RequestParam(value = "setName", required = false) String setName) {
        try {
            if (q == null || q.isBlank()) {
                return ResponseEntity.badRequest().build();
            }

            String combined = q.trim();
            if (setName != null && !setName.isBlank()) {
                combined = combined + " AND set.name:\"" + setName.trim().replace("\"", "\\\"") + "\"";
            }
            int safeLimit = Math.min(Math.max(limit, 1), 50);
            System.out.println("[SearchController] combined='" + combined + "', limit=" + safeLimit);

            List<SearchItem> items = pokemon.search(combined, safeLimit);
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            // bubble a clear signal to the client
            return ResponseEntity.status(502)
                    .header("X-Debug-Msg", e.getClass().getSimpleName() + ": " + e.getMessage())
                    .build();
        }
    }
}