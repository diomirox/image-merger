"use client";
import ImageNext from "next/image";
import { ChangeEvent, useState } from "react";

export default function Home() {
  const [images, setImages] = useState<string[]>([]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    let flList: File[] = [];
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
    // if (flList.length > 10) {
    //   // merge 10 by 10
    //   let mergeList: File[][] = [[]];
    //   let index = 0;
    //   for (let i = 0; i < flList.length; i++) {
    //     if (mergeList[index].length === 10) {
    //       index++;
    //       mergeList.push([]);
    //     }
    //     mergeList[index].push(flList[i]);
    //   }
    //   flList = [];

    // };
    setImages(flList.map((file) => URL.createObjectURL(file)));
  }

  return (
    <div>
      <input onChange={handleFileChange} accept="image/*" multiple={true} type="file" />
      <div className="relative min-h-2">
        {images.map((image, index) => {
          return (
            <div key={index}>
              <ImageNext src={image} alt="image" width={200} height={200} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
