package com.stacktrack.collections;

import java.time.Instant;

public class CollectionCardItem {
    private String id; // Firestore doc id (filled after write)
    private String cardId; // PokemonTCG.io id (e.g., "sv1-1")
    private String name;
    private String setName;
    private String imageSmall;
    private Double priceUSD;
    private String priceUpdatedAt;
    private Instant addedAt;

    public CollectionCardItem() {
    }

    public CollectionCardItem(String id, String cardId, String name, String setName,
            String imageSmall, Double priceUSD, String priceUpdatedAt, Instant addedAt) {
        this.id = id;
        this.cardId = cardId;
        this.name = name;
        this.setName = setName;
        this.imageSmall = imageSmall;
        this.priceUSD = priceUSD;
        this.priceUpdatedAt = priceUpdatedAt;
        this.addedAt = addedAt;
    }

    // getters/setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCardId() {
        return cardId;
    }

    public void setCardId(String cardId) {
        this.cardId = cardId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSetName() {
        return setName;
    }

    public void setSetName(String setName) {
        this.setName = setName;
    }

    public String getImageSmall() {
        return imageSmall;
    }

    public void setImageSmall(String imageSmall) {
        this.imageSmall = imageSmall;
    }

    public Double getPriceUSD() {
        return priceUSD;
    }

    public void setPriceUSD(Double priceUSD) {
        this.priceUSD = priceUSD;
    }

    public String getPriceUpdatedAt() {
        return priceUpdatedAt;
    }

    public void setPriceUpdatedAt(String priceUpdatedAt) {
        this.priceUpdatedAt = priceUpdatedAt;
    }

    public Instant getAddedAt() {
        return addedAt;
    }

    public void setAddedAt(Instant addedAt) {
        this.addedAt = addedAt;
    }
}
