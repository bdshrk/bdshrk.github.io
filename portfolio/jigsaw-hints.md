---
layout: default
title: Jigsaw Hints Group Project
splash: /assets/jigsawhints/logo_square_2x.jpg
parent: Portfolio
nav_order: 99
---

# Jigsaw Hints (Mobile Application)

**Deep learning image analysis to provide a hint of where jigsaw pieces go in the overall picture of the puzzle.**

![](/assets/jigsawhints/logo.jpg){:loading="lazy"}

The Jigsaw Hints mobile application is
built using an image recognition and machine learning technologies. The purpose of the mobile
app is for users to be able to seek assistance with their jigsaw puzzles, giving them hints and
clues as to how to solve the puzzle. This project has delivered a unique mobile app that employs cutting-edge
machine learning and computer vision techniques to assist jigsaw enthusiasts in solving
puzzles.

My contributions to the project included:
- A system to generate rendered jigsaw pieces for use in testing and training the neural network.
- Using OpenCV and Pillow to process images and remove unnecessary details like noise and backgrounds.
- Implementing an alternative computer vision solving method, SIFT (Scale-Invariant Feature Transform).
- Configuring a Flask server to host the solving techniques.

## App Walkthrough

![](/assets/jigsawhints/phone_process.png){:loading="lazy"}

*Finding a piece's location using the Android app based on the Flutter framework.*

1. The user takes a photograph of the base.
2. The user takes a photograph of the piece to match.
3. The images are sent to the server which begins processing the images and searching for a match.
4. The solved image is returned to the user.

## Image Processing (OpenCV & Pillow)

To take images from a phone's camera and prepare them to be able to be used
in the system, we first have to process the photos to remove any unwanted
information. To accomplish this, we use OpenCV, and Pillow, an updated fork of the Python Imaging
Library to modify the image. The most important step in preparing the image
is to remove the background. This is important as we do not want any method to try and
match on the background rather than the piece. This is
accomplished using the "rembg" Python library that uses a pretrained neural network to remove the background from any given
input. We found that this works well with images of jigsaw pieces.

As the processed jigsaw piece should be the input to a CNN, it was important to make sure that
all pieces had the same dimensions. To achieve this, we used OpenCV to calculate the
bounding rectangle that encompasses the entire image (ignoring any transparent areas that
are created when the background is removed). Once the bounding rectangle is calculated,
the image can then be cropped to this bounding box (removing the transparent regions),
and then the resulting jigsaw piece can be centred and scaled so that all output images have
the same dimensions.

In the image processing script, we also ensured that the code could be run as a Python
library, as well as standalone. There are also checks in place to make sure that the return
image is generally correct, i.e., not too much of the background has been remove (which
may sometimes happen with the "rembg" library). This image processing script was then
implemented within the Flask server to process the images as the requests are made.

## Scale-Invariant Feature Transform (SIFT)

SIFT works by using a difference-of-Gaussian function to extract key-points from a given
input image. These key-points are generated in areas of interest and remain relatively stable if
the input image is transformed. We perform this key-point extraction on both the base image
and the piece image. The idea being that even though the images are of different scale,
rotation, and perspective, a fair number of
the key-points extracted from the piece
image should also be present in the base
image, and a match can be found.

After the image has been proceeded via
the image processing script, SIFT can be
used to locate the piece on the base. With the background
removed, all the key-points extracted from
the piece image will only be on the piece,
not the background. This allows us to use
the extracted key-points to search for the
piece on the base. Each key-point is
compared to every other key-point on the
base image and an object of key-points and
their K best matches is constructed.

Next, we can loop through each key-point in the object and check whether the best matches
are within a certain ratio of each other as described in the original paper. If a
match is found, the matrix transformation is calculated and applied to the bounding box of
the puzzle piece to transform piece coordinates into the base coordinates. These points are
then used to draw the outline designating the matched area.

![](/assets/jigsawhints/figure_sift_match_process.png){:loading="lazy"}

*Example of SIFT using the image processing script to locate the individual piece on the jigsaw base identified via a red box.*

1. (Top-left) The original input image from a phone's camera.
2. (Bottom-left) The image after the image processing script.
3. (Right) The input image placed on the original (base) image after the SIFT algorithm.

We found that using SIFT gave us high accuracy when it managed to match but had issues
when attempting to match on pieces that were too noisy or too plain. An issue we found
with SIFT is that if it is not confident (as defined by parameters) as to where a piece is, it will
simply not find a match. We tried adjusting the parameters to make the matching more
lenient and found that this also caused false positives to appear. False positives are
particularly troublesome for SIFT as it has no way of giving a confidence for its match, so
there is no way for us to know if a match is a false positive without manually reviewing it.

Overall, the SIFT implementation also allowed us to test and develop the server and app with
actual data before the CNN was functioning and provided a faster alternative for solving.

## Server Host (Flask & ngrok)

The server is implemented in Flask, a Python module that allows us to use all the previously
written Python code without having to call Python externally. Flask also allows for
concurrency regarding the piece processing and matching code. The full sequence of
processing and matching a piece is handled by Flask per request, which means multiple
requests being processed at the same time do not cause issue with the system. Each request
contains all the information and data needed to match the contained piece onto the base.

This means that each request can be processed independently from each other (i.e., not
having to wait for the base image to be processed client-side before sending the piece data.)

![](/assets/jigsawhints/data.png){:loading="lazy"}

*Sample data sent to the Flask server from the app.*

We decided to use
JSON for transmitting all the data from
the app to the server. By using JSON, it
became easy to add new options to pass
to the server with the request (hint
accuracy, matching type to use, etc.).

The images themselves are transferred to the server as a JSON string which is the Base64
encoding representation of the image. After processing and matching the piece to the base,
the server returns another JSON object that contains the base image with the match area
indicated (also in Base64 encoding).

The server itself is run on a high-performance cluster. This is
necessary as the server will also need to perform the matching of the pieces as well as simply
being an endpoint for the app to communicate with. As machines that
run the server do not have open ports to allow us to connect, ngrok is used to create a
tunnel that allows us to connect from any device and network providing we know the URL. 
ngrok is run on the machine from a shell script before the server is executed.

## Computer-Generated Puzzles (Blender)

During the early stages of the project, when we had an initial
implementation of our jigsaw solver solution, we decided that
it would be impractical to take hundreds of real photograph of jigsaws and jigsaw pieces
(and no existing sources were available online). To solve this, we decided to use 
Blender to generate synthetic jigsaw pieces.

![](/assets/jigsawhints/testing_pieces.png){:loading="lazy"}

*Example of jigsaw pieces generated using Blender with different shapes, sizes and background images.*

These jigsaw pieces can be used to perform testing on any
implementation, as well as testing image processing scripts. Blender allows us write scripts in
Python to generate a large variety of pieces of different shapes, scales, and base images,
making it a fantastic tool for generating testing data.

When using Blender, we create an entire dataset of jigsaw pieces, from a variety of different
images. It was important we tested the CNN solution using a variation of images as each
would have unique features (e.g., size, shape, etc.).

## GitHub

[View all the associated repositories on GitHub.](https://github.com/stars/bdshrk/lists/jigsaw-hints){:target="_blank"}
