import { configureStore } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    entities: {},
    status: null
}

const entitiesSlice = createSlice({
    name: 'entities',
    initialState,
    reducers: {
        entityAdded(state, action)
        {
            // ✅ This "mutating" code is okay inside of createSlice!
            state.entities.push(action.payload)
        },

        entityUpdated(state, action)
        {
            Object.assign(state.entities[action.payload.key], action.payload.attributes)
        },

        entityRemoved(state, action)
        {
            return {
                ...state,
                status: 'loading'
            }
        }
    }
})

export const { entityAdded, entityUpdated, entityRemoved } = entitiesSlice.actions

export default configureStore({
    reducer: {
        scene: entitiesSlice.reducer
    },
});