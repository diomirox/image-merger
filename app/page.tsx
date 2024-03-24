"use client";
import { ChangeEvent, useState } from "react";

export default function Home() {
  const [images, setImages] = useState<string[]>([]);
  const [cutEdges, setCutEdges] = useState<number[]>([]);
  const [cutPosition, setCutPosition] = useState<number>(0);
  const [imgMeta, setImgMeta] = useState<{ width: number; height: number } | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    let flList: File[] = [];
    let edges: number[] = []
    let width = 0;
    let height = 0;
    for (let i = 0; i < files.length; i++) {
      if (files[i].type !== "image/jpeg" && files[i].type !== "image/png") {
        alert("Only jpeg and png files are allowed");
        continue;
      }
      const img = new Image();
      img.src = URL.createObjectURL(files[i]);
      await new Promise((resolve) => { // Remove the unused 'reject' parameter
        img.onload = () => {
          width = img.width;
          height += img.height;
          resolve("loaded");
        };
      });
      flList.push(files[i]);
    }
    if (flList.length > 10) {
      // merge 10 by 10
      let newFlList: File[] = [];
      let mergeList: File[][] = [[]];
      let index = 0;
      for (let i = 0; i < flList.length; i++) {
        if (mergeList[index].length === 10) {
          index++;
          mergeList.push([]);
        }
        mergeList[index].push(flList[i]);
      }
      flList = [];
      let mHeight = 0;
      for (let i = 0; i < mergeList.length; i++) {
        newFlList = mergeList[i];
        // merge the files
        const mergedCanvas = document.createElement("canvas");
        mergedCanvas.width = width;
        mergedCanvas.height = 0;
        mergedCanvas.style.zIndex = "-1";
        const mergedCtx = mergedCanvas.getContext("2d");
        for (let j = 0; j < newFlList.length; j++) {
          const img = new Image();
          img.src = URL.createObjectURL(newFlList[j]);
          await new Promise((resolve) => {
            img.onload = () => {
              resolve("loaded");
            };
          });
          mergedCanvas.height += img.height;
          mHeight += img.height;
        }
        let y = 0;
        for (let j = 0; j < newFlList.length; j++) {
          const img = new Image();
          img.src = URL.createObjectURL(newFlList[j]);
          await new Promise((resolve) => {
            img.onload = () => {
              y += img.height;
              mergedCtx?.drawImage(img, 0, y - img.height);
              resolve("loaded");
            };
          });
        }

        edges.push(mHeight);
        document.getElementById("canvas-viewer")?.appendChild(mergedCanvas);
        const mergedFile = await new Promise<File>((resolve) => {
          mergedCanvas.toBlob((blob) => {
            const file = new File([blob as Blob], "merged.jpg", { type: "image/jpeg" });
            resolve(file);
          }, "image/jpeg", 1);
        });
        flList.push(mergedFile);
      }
    }

    setCutEdges(edges);
    setImgMeta({ width, height });
    setImages(flList.map((file) => URL.createObjectURL(file)));
  };

  const handleVerticalDragStart = (event: any) => {
    setCutPosition(event.clientY);
  }

  const handleVerticalDrag = (event: any) => {
    const index = event.target.id.split("-")[1];
    const position = cutEdges[index] + event.clientY - cutPosition;
    let newEdges = cutEdges;
    newEdges[index] = position;
    setCutEdges([...newEdges]);
  };

  const handleDownload = async () => {
    const canvasList: HTMLCanvasElement[] = [];

    let prevHeight = 0;
    for (let i = 0; i < cutEdges.length; i++) {
      const canvas = document.createElement("canvas");
      canvas.width = imgMeta?.width as number;
      canvas.height = cutEdges[i] - prevHeight;
      prevHeight += cutEdges[i] - prevHeight;

      canvasList.push(canvas);
    }


    let drawHeight = 0;
    let remainingHeight = 0;
    let imageIndex = 0;
    for (let i = 0; i < canvasList.length; i++) {
      const canvas = canvasList[i];
      const ctx = canvas.getContext("2d");
      let canvasFillHeight = 0;
      while (canvasFillHeight < canvas.height) {
        const img = new Image();
        console.log(images[imageIndex], canvasFillHeight, remainingHeight, canvas.height, imageIndex, i);
        img.src = images[imageIndex];
        await new Promise((resolve) => {
          img.onload = () => {
            if (remainingHeight > 0) {
              ctx?.drawImage(img, 0, img.height - remainingHeight, img.width, remainingHeight, 0, canvasFillHeight, img.width, remainingHeight);
              canvasFillHeight += remainingHeight;
            } else {
              ctx?.drawImage(img, 0, canvasFillHeight);
              canvasFillHeight += img.height;
            }
            resolve("loaded");
          };
        });

        if (canvasFillHeight > canvas.height) {
          if (remainingHeight > 0) {
            canvas.height = canvasFillHeight;
            remainingHeight += canvasFillHeight - canvas.height;
          } else {
            remainingHeight = canvasFillHeight - canvas.height;
          }
          canvasFillHeight = canvas.height;
          imageIndex--;
        } else {
          remainingHeight = 0;
        }
        drawHeight += canvasFillHeight;
        imageIndex++;
      }

      const file = await new Promise<File>((resolve) => {
        canvas.toBlob((blob) => {
          const file = new File([blob as Blob], `page-${(i + 1).toString().padStart(3, "0")}.jpg`, { type: "image/jpg" });
          resolve(file);
        }, "image/jpeg", 1);
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(file);
      a.download = `page-${(i + 1).toString().padStart(3, "0")}.jpg`;
      a.click();

    }
  }

  const scrollerIntoCut = (event: any) => {
    console.log(event);
    const index = event.target.innerText.split(" - ")[0];
    const position = cutEdges[index];
    window.scrollTo({ top: position, behavior: "smooth" });
  }


  return (
    <div>
      <input onChange={handleFileChange} accept="image/*" multiple={true} type="file" />
      <button onClick={handleDownload}>Download</button>
      <div className="relative min-h-2">
        <div className="fixed flex flex-col space-y-3 top-1 right-[4px] bg-black z-100">
          {cutEdges.map((edge, index) => {
            return (
              <button key={index} onClick={scrollerIntoCut} className="m-2 p-1 bg-red-500 text-black">
                {index} - {edge}px
              </button>
            );
          })}
        </div>
        <div id="canvas-viewer" className="absolute left-0 top-0 z-0">

        </div>
        {/* {images.map((image, index) => {
          return (
            <div key={index}>
              <ImageNext src={URL.createObjectURL(image)} alt="image" width={200} height={200} />
            </div>
          );
        })} */}
        {cutEdges.map((edge, index) => {
          return (
            <div key={index}
              draggable={true}
              onDragEnd={handleVerticalDrag}
              onDragStart={handleVerticalDragStart}
              id={`position-${index}`}
              className="absolute bg-red-500 text-black h-[2px] w-full" style={{ top: edge }}>
              <div className="bg-red-500 w-[125px] m-2 p-1">
                {index} - {edge}px
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
