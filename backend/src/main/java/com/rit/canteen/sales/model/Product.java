package com.rit.canteen.sales.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products", indexes = {
    @Index(name = "idx_products_product_id", columnList = "productId"),
    @Index(name = "idx_products_name", columnList = "name"),
    @Index(name = "idx_products_category", columnList = "category")
})
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String productId;

    @NotBlank(message = "Product name is required")
    private String name;

    private String category;

    private String description;

    private BigDecimal basePrice;

    private BigDecimal price;

    private BigDecimal offerPrice;

    private Double discountPercent;

    private BigDecimal discountAmount;

    private String counter;

    private String tag;

    private BigDecimal parcelCharges;

    private String barcode;

    private boolean attributesOptional;

    // Additional Attributes
    private boolean isVeg;
    private boolean hasAllergy;

    private boolean parcelNotAllowed;

    private boolean sessionOptional;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "product_id")
    private List<ProductSession> sessions = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String imageData; // Base64 image data

    private boolean active = true;

    private Integer stock = 0;

    private Boolean isDraft = false;

    @ManyToMany(mappedBy = "products", fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"products", "baseItems", "sessions", "imageData"})
    private List<Stall> stalls = new ArrayList<>();

    public Product() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getBasePrice() { return basePrice; }
    public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public BigDecimal getOfferPrice() { return offerPrice; }
    public void setOfferPrice(BigDecimal offerPrice) { this.offerPrice = offerPrice; }

    public Double getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(Double discountPercent) { this.discountPercent = discountPercent; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public String getCounter() { return counter; }
    public void setCounter(String counter) { this.counter = counter; }

    public String getTag() { return tag; }
    public void setTag(String tag) { this.tag = tag; }

    public BigDecimal getParcelCharges() { return parcelCharges; }
    public void setParcelCharges(BigDecimal parcelCharges) { this.parcelCharges = parcelCharges; }

    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }

    public boolean isAttributesOptional() { return attributesOptional; }
    public void setAttributesOptional(boolean attributesOptional) { this.attributesOptional = attributesOptional; }

    public boolean isVeg() { return isVeg; }
    public void setVeg(boolean veg) { isVeg = veg; }

    public boolean isHasAllergy() { return hasAllergy; }
    public void setHasAllergy(boolean hasAllergy) { this.hasAllergy = hasAllergy; }

    public boolean isParcelNotAllowed() { return parcelNotAllowed; }
    public void setParcelNotAllowed(boolean parcelNotAllowed) { this.parcelNotAllowed = parcelNotAllowed; }

    public boolean isSessionOptional() { return sessionOptional; }
    public void setSessionOptional(boolean sessionOptional) { this.sessionOptional = sessionOptional; }

    public List<ProductSession> getSessions() { return sessions; }
    public void setSessions(List<ProductSession> sessions) { this.sessions = sessions; }

    public String getImageData() { return imageData; }
    public void setImageData(String imageData) { this.imageData = imageData; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public List<Stall> getStalls() { return stalls; }
    public void setStalls(List<Stall> stalls) { this.stalls = stalls; }

    public boolean isDraft() { return isDraft != null && isDraft; }
    public void setDraft(Boolean draft) { isDraft = draft; }
}
