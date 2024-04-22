import { configureStore } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

const displayOptionsSlice = createSlice({
  name: 'displayOptions',
  initialState: {
    showLightrays: true,
    showHitPoints: true,
    showLightPaths: true,
    showGL: false,
  },
  reducers: {
    setShowLightrays: (state, action) => {
      state.showLightrays = action.payload;
    },
    setShowHitPoints: (state, action) => {
      state.showHitPoints = action.payload;
    },
    setShowLightPaths: (state, action) => {
      state.showLightPaths = action.payload;
    },
    setShowGL: (state, action) => {
      state.showGL = action.payload;
    },
  },
});

export const { 
  setShowLightrays, 
  setShowHitPoints, 
  setShowLightPaths, 
  setShowGL 
} = displayOptionsSlice.actions;

export default configureStore({
  reducer: {
    displayOptions: displayOptionsSlice.reducer,
  },
});


