/**
 * Business Operations domain router: recipes, floor plan, store visits, integrations.
 */
import { Router } from 'express';
import brandsRoutes from '../routes/brands';
import bundlesRoutes from '../routes/bundles';
import dynamicPricingRoutes from '../routes/dynamicPricing';
import recipesRoutes from '../routes/recipes';
import integrationsRoutes from '../routes/integrations';
import storeVisitsRoutes from '../routes/storeVisits';
import floorPlanRoutes from '../routes/floorPlan';

const router = Router();

router.use('/brands', brandsRoutes);
router.use('/bundles', bundlesRoutes);
router.use('/dynamic-pricing', dynamicPricingRoutes);
router.use('/recipes', recipesRoutes);
router.use('/integrations', integrationsRoutes);
router.use('/store-visits', storeVisitsRoutes);
router.use('/floor-plan', floorPlanRoutes);

export default router;
