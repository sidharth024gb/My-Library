const stars = document.querySelectorAll("#rating-star");
const rating = document.getElementById("rating");

function ratingDisplay() {
  stars.forEach((star,index) => {
    if (rating.value >= index+1) {
      star.classList.add("checked");
    } else {
      star.classList.remove("checked");
    }
  });
}

stars.forEach((star,index) => {
  star.addEventListener("click", function () {
    rating.value = parseInt(index)+1;
    ratingDisplay();
    console.log(rating.value);
  });
});

ratingDisplay();
