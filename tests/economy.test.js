import test from 'node:test';
import assert from 'node:assert/strict';

const COIN_REWARDS = {
  app_opened: 2,
  day_active: 3,
  capture_made: 4,
  ask_made: 3,
  source_chip_opened: 1,
  task_handoff_created: 5
};

function usageDiscountRate(actionCount) {
  if (actionCount >= 120) return 0.3;
  if (actionCount >= 80) return 0.2;
  if (actionCount >= 40) return 0.1;
  return 0;
}

function themeCost(baseCost, actionCount) {
  if (baseCost === 0) return 0;
  return Math.max(30, Math.round(baseCost * (1 - usageDiscountRate(actionCount))));
}

test('usage rewards only defined app actions', () => {
  assert.equal(COIN_REWARDS.capture_made, 4);
  assert.equal(COIN_REWARDS.task_handoff_created, 5);
  assert.equal(COIN_REWARDS.unknown_action, undefined);
});

test('theme prices decrease with usage and keep a floor', () => {
  assert.equal(themeCost(0, 0), 0);
  assert.equal(themeCost(120, 0), 120);
  assert.equal(themeCost(120, 40), 108);
  assert.equal(themeCost(120, 80), 96);
  assert.equal(themeCost(120, 120), 84);
  assert.equal(themeCost(40, 120), 30);
});
