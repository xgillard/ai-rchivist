"""
This module is meant to implement checpointing utilities as decorator. This way
you can just annotate a function and have its result be automatically
checkpointed however you like after the annotated function has been called.
"""

from os import listdir, remove
from os.path import join, getmtime
from functools import wraps


def critical(lock):
    """
    This deceorator indicates that the function is actually the content of
    a critical section gated with the given lock
    """

    def decorator(fn):
        @wraps(fn)
        def decoration(*args, **kwargs):
            with lock:
                return fn(*args, **kwargs)

        return decoration

    return decorator


def checkpointed(save, directory='./checkpoints'):
    """
    This parameterized decorator lets you snapshot the value of a given
    dataframe after the method was called
    """

    def decorator(func):
        count = 0

        @wraps(func)
        def decoration(*args, **kwargs):
            """
            This is a wrapper function that effectively takes a snapsnot
            of df and saves it in dirrectory
            """
            nonlocal count
            # call the function (that's the point of a decorator after all)
            result = func(*args, **kwargs)
            # actually save the result to disk somewhere
            count += 1
            save(join(directory, f'checkpoint_{count}'))
            return result

        return decoration

    return decorator


def generational(directory='./checkpoints', generations=3):
    """
    Keeps at most 'generations' in the checkpoint directory
    """

    def decorator(fn):
        @wraps(fn)
        def decoration(*args, **kwargs):
            result = fn(*args, **kwargs)
            # just ditch the files that are too old to be kept in our
            # generational checkpointing scheme
            paths = [join(directory, e) for e in listdir(directory)]
            paths.sort(key=getmtime)
            for too_old in paths[:-generations]:
                remove(too_old)
            return result

        return decoration

    return decorator


def latest_checkpoint(directory):
    """
    Returns the latest known checkpoint
    """
    return max(
        (join(directory, e) for e in listdir(directory)),
        key=getmtime,
        default=None,
    )
