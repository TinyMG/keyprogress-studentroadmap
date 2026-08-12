---
name: test-optimize
description: Analyze test run data and recommend code optimizations to improve execution speed
when_to_use: Use when the user wants to optimize a test, speed up test execution, or analyze test performance
user-invocable: true
---

# Test Optimization Analyzer

Analyzes recent test run data for a specified test and provides actionable recommendations to improve execution speed without sacrificing accuracy.

## Input

- Test identifier: either test name (e.g., `test_01_add_vehicle`) or full test path (e.g., `drivewyzeqa_hub.testing.testcases.administration.vehicles.add_vehicle_tests.AddVehicleTests.test_01_add_vehicle`)

## Process

1. **Locate test results directory**
   - Default: `drivewyzeqa_hub/testing/test_results/`
   - Check for subdirectories with recent timestamps
   - Look for XML result files matching the test identifier

2. **Extract test execution data**
   - Parse XML test results for timing data
   - Identify the test method's execution time
   - Note any errors or warnings

3. **Analyze the test code**
   - Read the test file to understand structure
   - Identify common bottlenecks:
     - Explicit `time.sleep()` calls
     - Missing or overly conservative waits
     - Redundant API calls in setUp/tearDown
     - Unnecessary page refreshes
     - Inefficient element location strategies
     - Missing use of existing helper methods

4. **Generate recommendations**
   - Specific line numbers and code changes
   - Priority ranking (high/medium/low impact)
   - Expected time savings estimate
   - Risk assessment for each change

## Output Format

```markdown
# Test Optimization Report: {test_name}

## Current Performance
- Execution time: {X}s
- Test file: {path}

## Bottlenecks Identified

### High Priority
1. **{Issue}** (Line {N})
   - Current: `{code}`
   - Suggested: `{optimized_code}`
   - Expected savings: ~{X}s
   - Risk: Low/Medium/High

### Medium Priority
...

### Low Priority
...

## Implementation Notes
- {Any context-specific guidance}
- {Testing considerations}

## Estimated Total Savings
- Current: {X}s → Optimized: {Y}s ({Z}% improvement)
```

## Common Optimization Patterns

### Replace explicit sleeps
```python
# Before
time.sleep(3)

# After
self.wait_for_element_to_be_visible(locator, timeout=10)
```

### Use existing helpers
```python
# Before
self.driver.refresh()
hub_page = Hub(self.session)

# After
self.refresh_and_assert_hub_page(hub_page)
```

### Batch API operations
```python
# Before (setUp)
self.api.delete(f"vehicle/{vid1}")
self.api.delete(f"vehicle/{vid2}")

# After (tearDownClass)
self.api.delete(f"vehicle/?fleet={self.fleet_id}")  # Bulk delete
```

### Reduce page object re-instantiation
```python
# Before
modal = VehicleModal(self.session)
modal.click_save()
modal = VehicleModal(self.session)  # Redundant

# After
modal = VehicleModal(self.session)
modal.click_save()
modal.wait_for_close()
```

## Analysis Priorities

1. **Explicit waits** — highest ROI, safest change
2. **Redundant operations** — API calls, page refreshes, re-instantiations
3. **Inefficient selectors** — XPath vs CSS, overly broad searches
4. **Missing helper usage** — code duplication vs available mixins
5. **Setup/teardown scope** — class-level vs instance-level operations

## Validation

After optimization:
1. Run the test 3 times to confirm stability
2. Verify all assertions still pass
3. Check that timing improvement matches estimate
4. Ensure no new flakiness introduced
