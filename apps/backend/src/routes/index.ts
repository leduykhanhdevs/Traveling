import { Router } from 'express';
import { activityRouter } from './activity.routes.js';
import { budgetRouter } from './budget.routes.js';
import { communityRouter } from './community.routes.js';
import { discoverRouter } from './discover.routes.js';
import { itineraryRouter } from './itinerary.routes.js';
import { placesRouter } from './places.routes.js';
import { profileRouter } from './profile.routes.js';
import { speechRouter } from './speech.routes.js';
import { translateRouter } from './translate.routes.js';
import { utilityRouter } from './utility.routes.js';
import { paymentRouter } from './payment.routes.js';
import { uploadRouter } from './upload.routes.js';

export const apiRouter = Router();

apiRouter.use('/activity', activityRouter);
apiRouter.use('/budget', budgetRouter);
apiRouter.use('/community', communityRouter);
apiRouter.use('/discover', discoverRouter);
apiRouter.use('/itineraries', itineraryRouter);
apiRouter.use('/payments', paymentRouter);
apiRouter.use('/places', placesRouter);
apiRouter.use('/profile', profileRouter);
apiRouter.use('/speech', speechRouter);
apiRouter.use('/translate', translateRouter);
apiRouter.use('/utilities', utilityRouter);
apiRouter.use('/upload', uploadRouter);
