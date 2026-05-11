// @ts-nocheck
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';

const router = Router();

// POST /api/wallet/split — create a split session
router.post('/', requireAuth, async (req: any, res) => {
  try {
    const { totalAmount, participants, currency = 'INR' } = req.body;

    // RACHEL: attack surface — input validation: validate amount field type and range
    if (typeof totalAmount !== 'number' || totalAmount <= 0 || totalAmount > 1000000) {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid totalAmount: must be a positive number, max ₹1,000,000' });
    }

    // RACHEL: attack surface — input validation: validate participants array
    if (!Array.isArray(participants) || participants.length === 0 || participants.length > 100) {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid participants: required, array with 1-100 members' });
    }

    const perPerson = Math.ceil(totalAmount / (participants.length + 1)); // +1 for initiator

    // For now: return a simple split breakdown
    // Full implementation needs a SplitSession model and payment link generation
    res.json({
      success: true,
      data: {
        totalAmount,
        perPersonAmount: perPerson,
        participants,
        splitId: `split_${Date.now()}`,
        status: 'pending',
        message: 'Share this split ID with participants to collect payment',
      },
    });
  } catch (err: any) {
    // RACHEL: attack surface — verbose error responses: hide implementation details
    res.status(500).json({ success: false, error: 'An error occurred processing the split request' });
  }
});

export default router;
