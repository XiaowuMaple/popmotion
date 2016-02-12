import Action from '../actions/Action';

const boundProps = (actor, action) => ({
    addToFront: true,
    on: action.on,
    onStart: () => {
        actor.activateAction(action.id, action);

        // Copy Actor properties to Action
        for (let key in action.values) {
            if (action.values.hasOwnProperty(key)) {
                const actorValue = actor.value[key];
                const actionValue = action.value[key];

                for (let propKey in actorValue) {
                    if (actorValue.hasOwnProperty(valueKey)) {
                        
                    }
                }

                action.values[key].from = actor.values[key].current;
                action.values[key].velocity = actor.values[key].velocity;
            }
        }
    },
    onStop: () => {
        actor.deactivateAction(action.id);
    },
    onPreRender: ({ state, values }) => {
        // Update actor values with incoming state values
        for (let key in state) {
            if (state.hasOwnProperty(key)) {
                actor.state[key] = state[key];
                actor.values[key].current = values[key].current;
                actor.values[key].velocity = values[key].velocity;
            }
        }
    },
    onRender: undefined
});

export default class Actor extends Action {
    constructor(...args) {
        super(...args);
        this.activeActions = {};
        this.numActiveActions = 0;
    }

    set(props, instant) {
        if (instant || !this.reducer) {
            super.set(props);
            this.once();
        } else {
            const action = this.reducer(props);
            if (action) {
                this.start(action);
            }
        }
    }

    /*
        Bind Action to Actor
    */
    bind(action) {
        let newValues = {};
        let hasNewValues = false;

        // Create values on actor that don't exist
        for (let key in action.values) {
            if (action.values.hasOwnProperty(key) && !this.values.hasOwnProperty(key)) {
                newValues[key] = {};
            }
        }

        if (hasNewValues) {
            this.set(newValues);
        }

        return action.inherit(boundProps(this, action));
    }

    /*
        Start Actor

        If Action is provided, bind it to this Actor and start

        @param (optional) [Action]
    */
    start(action) {
        super.start();

        if (action) {
            const boundAction = this.bind(action);
            boundAction.start();

            return boundAction;
        } else {
            for (let key in this.activeActions) {
                if (this.activeActions.hasOwnProperty(key)) {
                    const action = this.activeActions[key];
                    if (!action.isActive) {
                        action.start();
                    }
                }
            }
        }

        return this;
    }

    stop() {
        super.stop();

        for (let key in this.activeActions) {
            if (this.activeActions.hasOwnProperty(key)) {
                this.activeActions[key].stop();
            }
        }
    }

    willRender(actor, frameStamp, elapsed) {
        // update actor values here
        // Update base values
        for (let i = 0; i < this.numValueKeys; i++) {
            const key = this.valueKeys[i];
            const value = this.values[key];

            if (value.driver) {
                value.current = this.activeActions[value.driver].values[key].current;
            }

            // Run transform function (if present)
            if (value.transform) {
                value.current = value.transform(value.current, key, this);
            }
        }

        super.willRender(actor, frameStamp, elapsed);
    }

    /*
        Add active actions

        @param [number]
        @param [Action]
    */
    activateAction(id, action) {
        this.activeActions[id] = action;
        this.numActiveActions++;

        if (this.numActiveActions) {
            super.start();
        }
    }

    /*
        Remove active actions

        @param [number]
    */
    deactivateAction(id) {
        delete this.activeActions[id];
        this.numActiveActions--;

        if (!this.numActiveActions && this.isActive) {
            super.stop();
        }
    }
}