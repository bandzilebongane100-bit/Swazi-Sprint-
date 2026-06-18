import { CharacterId } from "../types";

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  characterId: CharacterId,
  animationState: "run" | "jump" | "slide" | "crash",
  animTime: number,
  primaryColor: string,
  secondaryColor: string
) {
  ctx.save();
  ctx.translate(x, y);

  // Apply state-specific transformation
  let jumpY = 0;
  let stretchX = 1;
  let stretchY = 1;
  let rotateVal = 0;

  if (animationState === "jump") {
    // Simulating jumping bounce/squash
    jumpY = -Math.sin(animTime * Math.PI) * 15;
    ctx.translate(0, jumpY);
  } else if (animationState === "slide") {
    // Low squash, elongated horizontally
    stretchY = 0.55;
    stretchX = 1.35;
    ctx.translate(0, 15); // Sit on the floor
    ctx.scale(stretchX, stretchY);
  } else if (animationState === "crash") {
    // Tumbled state
    rotateVal = animTime * Math.PI * 4;
    ctx.rotate(rotateVal);
    ctx.translate(0, 10);
  }

  // Draw shadow
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.scale(1, 0.3);
  ctx.beginPath();
  ctx.arc(0, 45, 18 * scale * (animationState === "jump" ? 0.7 : 1), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Scale the skeleton drawing
  ctx.scale(scale, scale);

  // Standard character components (Head, Torso, Legs, Arms, Face details)
  const headRadius = 9;
  const headY = -35;
  const torsoWidth = 14;
  const torsoHeight = 22;
  const torsoY = -26;

  // Let's compute running cycle positions
  // Left arm/leg vs right arm/leg alternations
  const cycle = animTime * Math.PI * 2;
  const swingAmp = 0.6; // arm swing amplitude
  const legAmp = 0.7;   // leg swing amplitude

  let lArmSwing = Math.sin(cycle) * swingAmp;
  let rArmSwing = -Math.sin(cycle) * swingAmp;
  let lLegSwing = Math.cos(cycle) * legAmp;
  let rLegSwing = -Math.cos(cycle) * legAmp;

  if (animationState === "jump") {
    // Both arms up, legs slightly tucked
    lArmSwing = -Math.PI * 0.75;
    rArmSwing = -Math.PI * 0.75;
    lLegSwing = Math.PI * 0.2;
    rLegSwing = Math.PI * 0.25;
  } else if (animationState === "slide") {
    // Arms high, legs completely horizontal behind
    lArmSwing = -Math.PI * 0.4;
    rArmSwing = -Math.PI * 0.4;
    lLegSwing = Math.PI * 0.5;
    rLegSwing = Math.PI * 0.55;
  } else if (animationState === "crash") {
    lArmSwing = Math.sin(cycle * 3) * 1.5;
    rArmSwing = Math.cos(cycle * 3) * 1.5;
    lLegSwing = Math.sin(cycle * 3) * 1.2;
    rLegSwing = Math.cos(cycle * 3) * 1.2;
  }

  // Draw Legs (behind torso)
  const drawLeg = (side: "left" | "right", rotation: number) => {
    ctx.save();
    ctx.translate(side === "left" ? -4 : 4, -6);
    ctx.rotate(rotation);

    // Thigh
    ctx.lineWidth = 5.5;
    ctx.strokeStyle = side === "left" ? secondaryColor : primaryColor;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 12);
    ctx.stroke();

    // Calf
    ctx.translate(0, 11);
    ctx.rotate(animationState === "run" ? Math.sin(cycle + (side === "left" ? 0 : Math.PI)) * 0.3 + 0.3 : 0.2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 10);
    ctx.stroke();

    // Foot
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = "#374151"; // Shoe tint
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(4, 9);
    ctx.stroke();

    ctx.restore();
  };

  drawLeg("left", lLegSwing);
  drawLeg("right", rLegSwing);

  // Draw Torso/Clothes
  ctx.fillStyle = primaryColor;
  ctx.beginPath();
  // Round rect torso
  const r = 4;
  ctx.roundRect ? ctx.roundRect(-torsoWidth / 2, torsoY, torsoWidth, torsoHeight, r) : ctx.rect(-torsoWidth / 2, torsoY, torsoWidth, torsoHeight);
  ctx.fill();

  // Secondary details on clothes (strips, collar)
  ctx.fillStyle = secondaryColor;
  ctx.fillRect(-torsoWidth / 2 + 1, torsoY + 4, torsoWidth - 2, 4);

  // Draw Special Back Accents (Backpacks, traditional gear)
  if (characterId === CharacterId.Tourist) {
    // Explorer Brown Backpack
    ctx.fillStyle = "#78350f";
    ctx.fillRect(-torsoWidth / 2 - 4, torsoY + 3, 4, 14);
    ctx.fillStyle = "#451a03";
    ctx.fillRect(-torsoWidth / 2 - 4, torsoY + 1, 4, 3);
  } else if (characterId === CharacterId.Student) {
    // Yellow backpack
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(-torsoWidth / 2 - 1, torsoY + 10, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Arms (one behind, one in front depending on cycle)
  const drawArm = (side: "left" | "right", rotation: number) => {
    ctx.save();
    ctx.translate(side === "left" ? -torsoWidth / 2 - 1 : torsoWidth / 2 + 1, torsoY + 3);
    ctx.rotate(rotation);

    ctx.lineWidth = 4.5;
    ctx.strokeStyle = primaryColor;
    ctx.lineCap = "round";

    // Upper arm
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 10);
    ctx.stroke();

    // Lower arm
    ctx.translate(0, 9);
    ctx.rotate(0.3);
    ctx.strokeStyle = "#f3f4f6"; // skin tone or gloves
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 8);
    ctx.stroke();

    // Special: Traditional Dancer holds lightweight small shield & stick
    if (characterId === CharacterId.TraditionalDancer && side === "right") {
      ctx.fillStyle = "#dc2626"; // red/white cowhide shield
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(3, 4, 4, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // white stripe
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(3, 4, 1.5, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Traditional staff stick
      ctx.strokeStyle = "#854d0e";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(3, -6);
      ctx.lineTo(3, 14);
      ctx.stroke();
    }

    ctx.restore();
  };

  drawArm("left", lArmSwing);
  drawArm("right", rArmSwing);

  // Draw Head and Hair
  ctx.fillStyle = "#451a03"; // Skin Tone (dark brown / African melinated shades)
  ctx.beginPath();
  ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
  ctx.fill();

  // Face elements (Eyeballs / Sunglasses / Cap depends on Character)
  if (characterId === CharacterId.TaxiDriver) {
    // Taxi cap (yellow peaked cap)
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(0, headY - 6, headRadius, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#eab308";
    ctx.fillRect(0, headY - 8, 12, 3); // Peak of cap pointing right (runner runs forward/right slightly)
  } else if (characterId === CharacterId.Tourist) {
    // Safari explorer hat
    ctx.fillStyle = "#78350f";
    ctx.beginPath();
    ctx.ellipse(0, headY - 6, 12, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, headY - 6, headRadius - 2, Math.PI, 0);
    ctx.fill();
  } else if (characterId === CharacterId.MountainAdventurer) {
    // Safety orange helmet
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.arc(0, headY - 4, headRadius + 1, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-headRadius, headY - 2);
    ctx.lineTo(0, headY + 4);
    ctx.lineTo(headRadius, headY - 2);
    ctx.stroke();
  } else if (characterId === CharacterId.TraditionalDancer) {
    // Traditional head feather band (Ligcebesha / Umhlanga style accessories)
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, headY - 5, headRadius + 1, 0, Math.PI * 2);
    ctx.fill();
    
    // Little feathers sticking up
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(3, headY - 8);
    ctx.lineTo(8, headY - 18);
    ctx.stroke();
    ctx.strokeStyle = "#dc2626";
    ctx.beginPath();
    ctx.moveTo(-3, headY - 8);
    ctx.lineTo(-8, headY - 16);
    ctx.stroke();
  } else if (characterId === CharacterId.FootballStar) {
    // Dynamic sports headband
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(-headRadius + 0.5, headY - 5, headRadius * 2 - 1, 4);
  } else {
    // Lindiwe: Braided hair knots
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.arc(-headRadius + 1, headY - 5, 4, 0, Math.PI * 2);
    ctx.arc(headRadius - 1, headY - 5, 4, 0, Math.PI * 2);
    ctx.arc(0, headY - 8, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cute facial highlights (glowing explorer eyes or simple smile!)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(3, headY + 1, 2, 0, Math.PI);
  ctx.stroke();

  ctx.restore();
}
