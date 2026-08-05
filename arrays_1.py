def subarray_sum(nums, k):
    prefix_sum = 0
    hmap = {0: 1}          # the leftmost fencepost, seen once. Never patched again.
    count = 0
    for num in nums:       # exactly n iterations → the other n fenceposts
        prefix_sum += num
        sum_req = prefix_sum - k
        if sum_req in hmap:     # QUERY first
            count += hmap[sum_req]
        hmap[prefix_sum] = hmap.get(prefix_sum, 0) + 1   # RECORD second
    return count


# nums = [1, 1, 1], k = 2
# i = 0 -> hmap = {1: 1}, sum_req = -1, count = 0
# i = 1 -> hmap = {1: 1, 2: 1}, sum_req = 0, count = 1
# i = 2 -> hmap = {1: 1:, 2: 1, 3: 1}, sum_req = 1, count = 2

# nums = [1, -1, 1], k = 1
# i = 0 -> hmap = {1: 1, 0: 1}, prefix_sum = 1, sum_req = 0, count = 1
# i = 1 -> hmap = {1: 1, 0: 2}, prefix_sum = 0, sum_req = -1, count = 1
# i = 2 -> hmap = {1: 1:, 0: 2}, prefix_sum = 1, sum_req = 0, count = 2

# nums = [1, -1, 0], k = 0
# i = 0 -> hmap = {0: 1}, prefix_sum = 1, sum_req = 1, count = 0
# i = 1 -> hmap = {0: 1, 1: 1}, prefix_sum = 0, sum_req = 0, count = 1
# i = 2 -> hmap = {0: 2:, 1: 1}, prefix_sum = 0, sum_req = 0, count = 3
