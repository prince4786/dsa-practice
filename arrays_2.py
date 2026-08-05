def merge_arrays(intervals):
    if len(intervals) == 0:
        return []

    # sort the pairs of array based on the 1st number
    intervals.sort(key=lambda x: x[0])

    merged_intervals = []

    # now, keep the temp pair
    temp_pair = intervals[0]
    for i in range(1, len(intervals)):
        cur_pair = intervals[i]
        if cur_pair[0] > temp_pair[1]:
            merged_intervals.append(temp_pair)
            temp_pair = cur_pair
            continue

        temp_pair[1] = max(temp_pair[1], cur_pair[1])

    merged_intervals.append(temp_pair)

    return merged_intervals
