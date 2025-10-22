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

    @GetMapping("/catalog")
    public ResponseEntity<List<SearchItem>> catalog(
            @RequestParam("q") String q,
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        try {
            if (q == null || q.isBlank())
                return ResponseEntity.badRequest().build();
            List<SearchItem> items = pokemon.search(q.trim(), limit);
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            e.printStackTrace(); // <-- keep for now so we can see upstream issues
            // Temporary mock so we can proceed with the UI
            List<SearchItem> mock = List.of(
                    new SearchItem("sv1-1", "Sprigatito", "Scarlet & Violet",
                            "https://images.pokemontcg.io/sv1/1.png", 0.35, "2025-10-20T00:00:00Z"),
                    new SearchItem("sv1-2", "Floragato", "Scarlet & Violet",
                            "https://images.pokemontcg.io/sv1/2.png", 0.45, "2025-10-20T00:00:00Z"));
            return ResponseEntity.ok(mock);
        }
    }

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("ok");
    }
}
