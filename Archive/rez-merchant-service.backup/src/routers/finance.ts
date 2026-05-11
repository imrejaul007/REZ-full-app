/**
 * Finance & Payroll domain router: payroll, expenses, wallet, GST, bulk ops.
 */
import { Router } from 'express';
import payrollRoutes from '../routes/payroll';
import expensesRoutes from '../routes/expenses';
import payoutsRoutes from '../routes/payouts';
import walletMerchantRoutes from '../routes/walletMerchant';
import khataRoutes from '../routes/khata';
import gstRoutes from '../routes/gst';
import wasteRoutes from '../routes/waste';
import subscriptionRoutes from '../routes/subscription';
import bulkImportRoutes from '../routes/bulkImport';
import bulkRoutes from '../routes/bulk';
import bizdocsRoutes from '../routes/bizdocs';
import purchaseOrderRoutes from '../routes/purchaseOrders';
import supplierRoutes from '../routes/suppliers';
import corporateRoutes from '../routes/corporate';

const router = Router();

router.use('/payroll', payrollRoutes);
router.use('/expenses', expensesRoutes);
router.use('/payouts', payoutsRoutes);
router.use('/wallet', walletMerchantRoutes);
router.use('/khata', khataRoutes);
router.use('/gst', gstRoutes);
router.use('/waste', wasteRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/bulk-import', bulkImportRoutes);
router.use('/bulk', bulkRoutes);
router.use('/bizdocs', bizdocsRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/corporate', corporateRoutes);

export default router;
