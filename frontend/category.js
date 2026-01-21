const params = new URLSearchParams(window.location.search);
const type = params.get("type");

const titleEl = document.getElementById("categoryTitle");
const descEl = document.getElementById("categoryDesc");
const container = document.getElementById("categoryProducts");

/* CATEGORY DESCRIPTIONS */
const categoryDescMap = {
  Vegetables: "Vegetables are edible parts of plants—like roots (carrots), stems (celery), leaves (spinach), flowers (broccoli), or seeds (peas)—used as food, often in savory dishes, though botanically some \"vegetables\" like tomatoes are fruits. They are nutritious, providing vitamins, minerals, and fiber, and come fresh, frozen, canned, or dried, categorized by nutrient profile (dark green, red/orange, starchy, etc.) for dietary guidance.  ",
  Fruits: "A fruit is botanically the seed-bearing structure from a flowering plant's ripened ovary, serving to protect and disperse seeds, and can be fleshy (like apples, mangoes) or dry (like nuts). In culinary terms, fruits are usually sweet, pulpy, and eaten raw (berries, bananas), while botanically, they also include items like tomatoes, cucumbers, and beans, which are often called vegetables. They are vital for nutrition, offering vitamins, fiber, and minerals, and form a key part of a balanced diet. ",
  Dairy: "Dairy refers to products made from the milk of mammals (cows, goats, sheep, etc.), like milk, cheese, yogurt, and butter, or a place (farm, facility, shop) where these are produced, stored, or sold, often emphasizing their nutritional value (calcium, protein) and role in diets, though some avoid them due to lactose intolerance or ethical reasons.",
  Snacks: "A snack is a small portion of food eaten between main meals, serving as a light bite or quick refreshment, ranging from simple items like fruit and nuts to processed, packaged foods such as chips, crackers, and sweets, characterized by convenience, portability, and flavor for quick energy or satisfaction. Snacks are less formal than meals, providing fuel when hungry, and can be healthy choices or indulgent treats, sometimes replacing a full meal entirely. ",
  Rice: "Rice is a vital cereal grain from a grass plant, a staple for over half the world, known for its starchy kernels that vary in size (long, medium, short) and texture (fluffy to sticky) when cooked, offering energy, fiber, and nutrients like B vitamins, iron, and manganese, with brown rice retaining more nutrients than white rice due to its outer layers. Grown worldwide in flooded paddies or dry fields, rice plants grow tall with leafy stalks, producing flowers that yield the edible grain, which is processed by milling to create different types like brown, white, and aromatic varieties. ",
  Batter: "Batter is a thin, pourable liquid mixture, typically flour, eggs, and milk/water, used to coat foods for frying (like fish & chips) or to make cakes, pancakes, and waffles, creating a light, often crispy result. It's distinct from dough (thicker, kneadable) and can be leavened (baking powder/soda) for fluffiness or unleavened for crispness, with variations like tempura or crepe batters. "
};

titleEl.innerText = type;
descEl.innerText = categoryDescMap[type] || "";

/* FETCH PRODUCTS FROM BACKEND */
fetch(`https://grosgo-backend-ohy8.onrender.com/products?category=${type}`)
  .then(res => res.json())
  .then(products => {
    container.innerHTML = "";

    if (products.length === 0) {
      container.innerHTML = "<p>No products found</p>";
      return;
    }
products.forEach(p => {
  container.innerHTML += `
    <div class="product-card"
         onclick="goToProduct(
  '${p.name}',
  ${p.price},
  '${p.image}',
  '${p.home_section}',
  '${p.category}'
)
">

      <img src="${p.image}">
      <h3>${p.name}</h3>
      <p>₹${p.price}</p>

      <div class="product-actions">
        <button onclick="event.stopPropagation(); addToCart('${p.name}', ${p.price}, 1)">
          🛒 Add to Cart
        </button>

        <button onclick="event.stopPropagation(); addToWishlist('${p.name}', ${p.price}, '${p.image}')">
          ❤️ Wishlist
        </button>
      </div>

    </div>
  `;
});



  })
  .catch(err => {
    console.error(err);
    container.innerHTML = "<p>Server not running</p>";
  });

