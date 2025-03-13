# XEdge Backend

## Workflow Node ID Validation

The backend now includes validation to ensure all nodes in a workflow have IDs before saving. This prevents potential backend crashes when processing workflows with missing node IDs.

### Implementation Details

1. **Validation Logic**: Added in the `PUT /api/deployments/:id/workflow` endpoint in `deployment.routes.ts`.
2. **Error Handling**: Returns a 400 error with a clear message if any node is missing an ID.
3. **Database Model**: Uses the `WorkflowModel` to store and retrieve workflow data.

### Testing

Two test scripts are provided to verify the validation logic:

1. **Simple Test Script**: `test-simple.js` - A focused test for the validation logic.
2. **Comprehensive Test Script**: `test-workflow-validation.js` - A more complete test that includes server and deployment checks.

To run the tests:

```bash
# Install dependencies if needed
npm install jsonwebtoken

# Run the simple test
node test-simple.js

# Run the comprehensive test
node test-workflow-validation.js

# Test with a specific deployment ID
node test-workflow-validation.js --deployment-id=2
```

### Expected Results

- Valid workflows (all nodes have IDs) should be accepted and saved.
- Invalid workflows (any node missing an ID) should be rejected with a 400 error.

### Notes

- The tests use a JWT token generated with the secret from the `.env` file.
- The token is sent in the `x-auth-token` header as required by the authentication middleware.
- The default deployment ID is 1, but can be changed with the `--deployment-id` parameter. 