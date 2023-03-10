// Call this method and pass any value to start the animation
// The 'value' should be in between 0 to 100
function animateCircle(value) {
  var svgCircle = document.querySelectorAll(".foreground-circle svg circle");

  var numberInsideCircle = document.getElementById("number-inside-circle");

  // Get the stroke-dasharray value from CSS
  var svgStrokeDashArray = parseInt(
    window
      .getComputedStyle(svgCircle[0])
      .getPropertyValue("stroke-dasharray")
      .replace("px", "")
  );

  // To animte the circle from the previous value
  var previousStrokeDashOffset = svgStrokeDashArray;

  // To animate the number from the previous value
  var previousValue = 0;

  var animationDuration = 1000;

  var offsetValue = Math.floor(((100 - value) * svgStrokeDashArray) / 100);

  // This is to animate the circle
  svgCircle[0].animate(
    [
      // initial value
      {
        strokeDashoffset: previousStrokeDashOffset,
      },
      // final value
      {
        strokeDashoffset: offsetValue,
      },
    ],
    {
      duration: animationDuration,
    }
  );

  // Without this, circle gets filled 100% after the animation
  svgCircle[0].style.strokeDashoffset = offsetValue;

  // This is to animate the number.
  // If the current value and previous values are same,
  // no need to do anything. Check the condition.
  if (value != previousValue) {
    var speed;
    if (value > previousValue) {
      speed = animationDuration / (value - previousValue);
    } else {
      speed = animationDuration / (previousValue - value);
    }

    // start the animation from the previous value
    var counter = previousValue;

    var intervalId = setInterval(() => {
      if (counter == value || counter == -1) {
        // End of the animation

        clearInterval(intervalId);

        // Save the current values
        previousStrokeDashOffset = offsetValue;
        previousValue = value;
      } else {
        if (value > previousValue) {
          counter += 1;
        } else {
          counter -= 1;
        }

        numberInsideCircle.innerHTML = counter + "%";
      }
    }, speed);
  }
}

module.exports = animateCircle;

/* function animateLoading() {
  var randomValue = Math.floor(Math.random() * 101);
  console.log("Random Value: ", randomValue);
  animteCircle(randomValue);
}

// Animate with some value when the page loads first time
animteCircle(40); */
